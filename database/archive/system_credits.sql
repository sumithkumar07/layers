-- System: Universal Compute Credits (Safe / Idempotent)

-- 1. Create users table (Safe)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  credits int default 100,
  is_active boolean default true,
  created_at timestamptz default now()
);
-- 2. Enable RLS
alter table public.users enable row level security;

-- 3. Policy: Users can view own data (Drop & Recreate)
drop policy if exists "Users can view own data" on public.users;
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

-- 4. Trigger: Sync auth.users to public.users (Safe)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, credits)
  values (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'), 100)
  on conflict (id) do update
  set
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication error
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Credit Logs (Safe)
create table if not exists public.credit_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade,
    amount int not null,
    action text not null,
    created_at timestamptz default now()
);
alter table public.credit_logs enable row level security;

drop policy if exists "Users can view their own credit logs" on public.credit_logs;
create policy "Users can view their own credit logs" on public.credit_logs for select using (auth.uid() = user_id);

-- 6. API Key Permissions (Drop & Recreate)
drop policy if exists "Enable insert for authenticated users only" on "public"."api_keys";
create policy "Enable insert for authenticated users only" on "public"."api_keys" for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Enable select for authenticated users only" on "public"."api_keys";
create policy "Enable select for authenticated users only" on "public"."api_keys" for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Enable delete for authenticated users only" on "public"."api_keys";
create policy "Enable delete for authenticated users only" on "public"."api_keys" for delete to authenticated using (auth.uid() = user_id);
