-- Add lookup_hash column for O(1) API key lookups
-- This migration must be run in order to ensure data integrity

BEGIN;

-- Step 1: Add column as nullable first (for existing data)
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS lookup_hash text;

-- Step 2: Backfill existing data
-- Note: This assumes the original api_key column still exists
-- If you've already migrated to api_key_hash only, adjust accordingly
UPDATE api_keys
SET lookup_hash = encode(digest(COALESCE(api_key, _api_key_backup), 'sha256'), 'hex')
WHERE lookup_hash IS NULL 
  AND (api_key IS NOT NULL OR _api_key_backup IS NOT NULL);

-- Step 3: Verify backfill completed successfully
DO $$
DECLARE
  null_count int;
BEGIN
  SELECT COUNT(*) INTO null_count FROM api_keys WHERE lookup_hash IS NULL;
  IF null_count > 0 THEN
    -- CRITICAL: Fail the transaction if data is missing to prevent NOT NULL constraint violation
    RAISE EXCEPTION 'Cannot proceed: % rows have NULL lookup_hash. Check if api_key column is populated.', null_count;
  ELSE
    RAISE NOTICE 'Success: All rows have lookup_hash populated';
  END IF;
END $$;

-- Step 4: Add NOT NULL constraint (now safe because data is backfilled)
ALTER TABLE api_keys 
ALTER COLUMN lookup_hash SET NOT NULL;

-- Step 5: Add comment explaining the column
COMMENT ON COLUMN api_keys.lookup_hash IS 'SHA256 hash of the API key for fast O(1) lookup before bcrypt verification';

COMMIT;

-- Step 6: Create index for fast O(1) lookups
-- Moved outside transaction to allow CONCURRENT creation (avoids locking table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_lookup_hash ON api_keys(lookup_hash);

-- Verification query (run after migration)
-- SELECT COUNT(*) as total, COUNT(lookup_hash) as with_hash FROM api_keys;
