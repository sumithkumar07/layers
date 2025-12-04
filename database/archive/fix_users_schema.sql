-- FIX SCHEMA: Add missing columns to users table

-- 1. Add email column if it doesn't exist
alter table public.users 
add column if not exists email text;

-- 2. Add full_name column if it doesn't exist
alter table public.users 
add column if not exists full_name text;

-- 3. Sync existing data (Backfill email/name from auth.users)
update public.users u
set 
  email = a.email,
  full_name = COALESCE(a.raw_user_meta_data->>'full_name', 'Unknown User')
from auth.users a
where u.id = a.id
and (u.email is null or u.full_name is null);

-- 4. Re-run the Sync Insert (Safe)
insert into public.users (id, email, full_name, credits)
select 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Unknown User'), 
  100
from auth.users
on conflict (id) do update
set 
  email = excluded.email,
  full_name = excluded.full_name;
