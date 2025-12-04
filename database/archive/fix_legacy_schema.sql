-- FIX LEGACY SCHEMA: Allow NULL api_key and Sync Users safely

BEGIN;

-- 1. Make api_key nullable (Since we now use the api_keys table)
alter table public.users alter column api_key drop not null;

-- 2. Add missing columns (Safety check)
alter table public.users add column if not exists email text;
alter table public.users add column if not exists full_name text;

-- 3. Sync data from auth.users with safeguards and logging
DO $$
DECLARE
  rows_affected int;
BEGIN
  -- Pre-flight check: Ensure auth.users exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'auth') THEN
    RAISE EXCEPTION 'auth.users table not found - cannot sync users';
  END IF;

  -- Perform Sync
  insert into public.users (id, email, full_name, credits)
  select 
    id, 
    email, 
    -- Handle missing full_name with fallback
    COALESCE(raw_user_meta_data->>'full_name', 'Unknown User'), 
    100 -- Default credits for NEW users only
  from auth.users
  on conflict (id) do update
  set 
    email = excluded.email,
    full_name = excluded.full_name;
    -- Note: credits are NOT updated, preserving existing balances for old users
    
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RAISE NOTICE 'Migration complete: % users synced/updated', rows_affected;
END $$;

COMMIT;
