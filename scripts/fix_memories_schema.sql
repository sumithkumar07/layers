-- FIX MEMORIES SCHEMA & RLS

-- 0. Ensure pgvector extension exists
create extension if not exists vector;

-- 1. Ensure Table Exists
create table if not exists public.memories (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references public.users(id) on delete cascade,
    content text,
    embedding vector(384), -- Adjust dim if needed
    tags text[],
    created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.memories enable row level security;

-- 3. Policies
drop policy if exists "Users can insert own memories" on public.memories;
create policy "Users can insert own memories" on public.memories
    for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can select own memories" on public.memories;
create policy "Users can select own memories" on public.memories
    for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete own memories" on public.memories;
create policy "Users can delete own memories" on public.memories
    for delete to authenticated using (auth.uid() = user_id);
