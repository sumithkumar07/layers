-- SYNC ALL USERS (Backfill)
-- Run this to ensure ALL users in auth.users exist in public.users

insert into public.users (id, email, full_name, credits)
select 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Unknown User'), 
  100
from auth.users
on conflict (id) do nothing;

-- Verify the count
select count(*) from public.users;
