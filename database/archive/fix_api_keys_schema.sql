-- Fix api_keys table schema with Backfill
-- This script safely adds columns and attempts to backfill data from raw 'api_key' if it exists.

-- 0. Enable pgcrypto for hashing (needed for backfill)
create extension if not exists pgcrypto;

-- 1. Add key_prefix if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'key_prefix') THEN
        ALTER TABLE api_keys ADD COLUMN key_prefix text;
    END IF;
END $$;

-- 2. Add key_hash if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'key_hash') THEN
        ALTER TABLE api_keys ADD COLUMN key_hash text;
        ALTER TABLE api_keys ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);
    END IF;
END $$;

-- 3. Add lookup_hash if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'lookup_hash') THEN
        ALTER TABLE api_keys ADD COLUMN lookup_hash text;
    END IF;
END $$;

-- 4. BACKFILL DATA (Crucial Step)
-- If 'api_key' column exists, use it to populate the new columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'api_key') THEN
        -- Backfill key_prefix
        UPDATE api_keys 
        SET key_prefix = substring(api_key from 1 for 4) 
        WHERE key_prefix IS NULL AND api_key IS NOT NULL;

        -- Backfill key_hash (using bcrypt via pgcrypto)
        -- Note: gen_salt('bf') generates a bcrypt salt
        UPDATE api_keys 
        SET key_hash = crypt(api_key, gen_salt('bf')) 
        WHERE key_hash IS NULL AND api_key IS NOT NULL;

        -- Backfill lookup_hash (SHA256)
        UPDATE api_keys 
        SET lookup_hash = encode(digest(api_key, 'sha256'), 'hex') 
        WHERE lookup_hash IS NULL AND api_key IS NOT NULL;
    END IF;
END $$;

-- 4.5. Create index after backfill for better performance
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_api_keys_lookup_hash ON api_keys(lookup_hash);
END $$;

-- 5. Enforce Constraints (Safely)
DO $$
BEGIN
    -- Only enforce NOT NULL if there are no NULLs left (i.e., backfill succeeded or table was empty)
    IF NOT EXISTS (SELECT 1 FROM api_keys WHERE key_prefix IS NULL) THEN
        ALTER TABLE api_keys ALTER COLUMN key_prefix SET NOT NULL;
        ALTER TABLE api_keys ADD CONSTRAINT check_key_prefix_length CHECK (length(key_prefix) >= 4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM api_keys WHERE key_hash IS NULL) THEN
        ALTER TABLE api_keys ALTER COLUMN key_hash SET NOT NULL;
    END IF;
    
    -- lookup_hash: Enforce NOT NULL if backfill succeeded. 
    -- If NULLs remain, we leave it nullable to allow Python 'Lazy Migration' to fill them in on first use.
    IF NOT EXISTS (SELECT 1 FROM api_keys WHERE lookup_hash IS NULL) THEN
        ALTER TABLE api_keys ALTER COLUMN lookup_hash SET NOT NULL;
    END IF;
END $$;

-- 6. Re-apply policies (just in case)
alter table api_keys enable row level security;

drop policy if exists "Users can view their own keys" on api_keys;
create policy "Users can view their own keys"
  on api_keys for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own keys" on api_keys;
create policy "Users can create their own keys"
  on api_keys for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own keys" on api_keys;
create policy "Users can delete their own keys"
  on api_keys for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own keys" on api_keys;
create policy "Users can update their own keys"
  on api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
