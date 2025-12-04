-- Create users table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  api_key text not null unique,
  is_active boolean default true,
  -- numeric(3,2) allows 1.00 (100% confidence), while check constraint ensures 0-1 range
  confidence numeric(3,2) not null check (confidence between 0 and 1)
-- Create logs table
create table public.logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete restrict,
  claim text not null,  evidence text not null,
  result text not null,
  confidence float not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTE: Test data removed for security reasons.
-- To insert test data, use a separate seed.sql file (git-ignored)
-- or a test fixture script that runs only in development/test environments.
-- Example seed.sql:
--   INSERT INTO public.users (api_key) VALUES ('dev-test-key');
