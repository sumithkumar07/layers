-- 1. Enable pgcrypto for hashing
create extension if not exists pgcrypto;

-- 2. Add new columns
alter table api_keys 
add column if not exists api_key_hash text,
add column if not exists prefix text;

-- 3. Migrate existing keys (One-time)
-- Wrapped in transaction for atomicity and safety
BEGIN;BEGIN;

update api_keys
set 
  api_key_hash = encode(digest(api_key, 'sha256'), 'hex'),
  prefix = substring(api_key from 1 for 12) || '...'
where api_key_hash is null and api_key is not null;

-- 4. Make columns required for future
alter table api_keys 
alter column api_key_hash set not null,
alter column prefix set not null;

-- 5. Rename old column to backup (Safety first)
-- We don't drop it immediately to prevent data loss if something goes wrong.
-- User can drop it manually later: alter table api_keys drop column _api_key_backup;
alter table api_keys 
rename column api_key to _api_key_backup;

-- 6. Create index for fast lookup
create index if not exists idx_api_keys_hash on api_keys(api_key_hash);

COMMIT;

-- ============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================================================
-- WARNING: Only run these steps if you need to revert the migration.
-- This will restore the original api_key column and remove the new columns.
--
-- Step 1: Restore the original api_key column
-- alter table api_keys rename column _api_key_backup to api_key;
--
-- Step 2: Drop the new columns
-- alter table api_keys drop column if exists api_key_hash;
-- alter table api_keys drop column if exists prefix;
--
-- Step 3: Drop the index
-- drop index if exists idx_api_keys_hash;
--
-- Step 4: Drop the extension (optional, only if not used elsewhere)
-- drop extension if exists pgcrypto;
-- ============================================================================
