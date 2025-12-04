-- MASTER SCHEMA CONSOLIDATION
-- Run this script to ensure your ENTIRE database is correctly set up.
-- It is "idempotent" (safe to run multiple times).

-- 1. USERS TABLE
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  credits bigint default 100,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Ensure columns exist (for legacy tables)
alter table public.users add column if not exists email text;
alter table public.users add column if not exists full_name text;
alter table public.users alter column api_key drop not null; -- Relax legacy constraint

-- 2. API KEYS TABLE
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  name text,
  key_prefix text,
  api_key_hash text not null,
  lookup_hash text,
  created_at timestamptz default now(),
  last_used_at timestamptz
);
create index if not exists idx_api_keys_lookup_hash on public.api_keys(lookup_hash);

-- 3. CREDIT LOGS TABLE
create table if not exists public.credit_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade,
    amount bigint not null,
    action text not null,
    created_at timestamptz default now()
);
-- 3.5 TRANSACTIONS TABLE (Razorpay)
create table if not exists public.transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade,
    amount int not null, -- Amount in smallest currency unit (e.g., paise)
    currency text default 'INR',
    credits_amount bigint not null, -- How many credits this buys
    razorpay_order_id text unique,
    razorpay_payment_id text,
    status text default 'pending', -- pending, success, failed
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3.6 TRANSACTIONS RLS
alter table public.transactions enable row level security;

drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions" on public.transactions for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own transactions" on public.transactions;
create policy "Users can insert their own transactions" on public.transactions for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions" on public.transactions for update using (auth.uid() = user_id);

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.users enable row level security;
alter table public.api_keys enable row level security;
alter table public.credit_logs enable row level security;

-- Users Policy
drop policy if exists "Users can view own data" on public.users;
create policy "Users can view own data" on public.users for select using (auth.uid() = id);

-- API Keys Policies
drop policy if exists "Enable insert for authenticated users only" on "public"."api_keys";
create policy "Enable insert for authenticated users only" on "public"."api_keys" for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Enable select for authenticated users only" on "public"."api_keys";
create policy "Enable select for authenticated users only" on "public"."api_keys" for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Enable delete for authenticated users only" on "public"."api_keys";
create policy "Enable delete for authenticated users only" on "public"."api_keys" for delete to authenticated using (auth.uid() = user_id);

-- Credit Logs Policy
drop policy if exists "Users can view their own credit logs" on public.credit_logs;
create policy "Users can view their own credit logs" on public.credit_logs for select using (auth.uid() = user_id);

-- 5. AUTOMATION (Triggers)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, credits)
  values (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'), 100)
  on conflict (id) do update
  set email = excluded.email, full_name = excluded.full_name;
  return new;
end;
$$ language plpgsql security definer;

-- Recreate Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. FINAL SYNC (Just in case)
insert into public.users (id, email, full_name, credits)
select id, email, COALESCE(raw_user_meta_data->>'full_name', 'Unknown User'), 100
from auth.users
on conflict (id) do update
set email = excluded.email, full_name = excluded.full_name;

-- 7. MEMORIES & HYBRID SEARCH
create extension if not exists vector;

-- DROP TABLE to enforce UUID migration (WARNING: Clears Memories)
-- Guard against accidental production data loss
DO $$
BEGIN
  -- Only allow drop if NOT in production (adjust condition as needed)
  -- For now, we'll just warn and require manual intervention or specific env var
  -- IF current_database() = 'production' THEN
  --   RAISE EXCEPTION 'Destructive migration blocked in production';
  -- END IF;
  
  -- Uncomment the below line only if you are sure you want to wipe data
  -- DROP TABLE IF EXISTS public.memories CASCADE;
  NULL;
END $$;

create table if not exists public.memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  embedding vector(384),
  content_tsvector tsvector generated always as (to_tsvector('english', content)) stored,
  tags text[],
  created_at timestamptz default now()
);

create index if not exists idx_memories_embedding on public.memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_memories_content_ts on public.memories using gin (content_tsvector);
create index if not exists idx_memories_tags on public.memories using gin (tags);

alter table public.memories enable row level security;

drop policy if exists "Users view their own memories" on public.memories;
create policy "Users view their own memories" on public.memories for select using (auth.uid() = user_id);

drop policy if exists "Users insert their own memories" on public.memories;
create policy "Users insert their own memories" on public.memories for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete their own memories" on public.memories;
create policy "Users delete their own memories" on public.memories for delete using (auth.uid() = user_id);

-- 8. STORED PROCEDURES (RPCs)

-- Deduct Credits Atomic
DROP FUNCTION IF EXISTS deduct_credits_atomic(uuid, int, text);
DROP FUNCTION IF EXISTS deduct_credits_atomic(uuid, bigint, text);
CREATE OR REPLACE FUNCTION deduct_credits_atomic(p_user_id uuid, p_amount bigint, p_action text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_credits bigint;
  v_new_balance bigint;
BEGIN
  -- Authorization check: Ensure caller can only modify their own credits
  -- Allow service_role to bypass this check for admin/batch operations
  IF auth.uid() != p_user_id AND current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Cannot deduct credits for other users';
  END IF;
  
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  -- Validate action is not null or empty
  IF p_action IS NULL OR p_action = '' THEN
    RAISE EXCEPTION 'Action must be a non-empty string';
  END IF;
  SELECT credits INTO v_current_credits FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_current_credits < p_amount THEN RAISE EXCEPTION 'Insufficient credits'; END IF;
  v_new_balance := v_current_credits - p_amount;
  UPDATE public.users SET credits = v_new_balance WHERE id = p_user_id;
  INSERT INTO public.credit_logs (user_id, amount, action) VALUES (p_user_id, -p_amount, p_action);
  RETURN v_new_balance;
END;
$$;

-- Refund Credits Atomic
DROP FUNCTION IF EXISTS refund_credits_atomic(uuid, int, text);
DROP FUNCTION IF EXISTS refund_credits_atomic(uuid, bigint, text);
CREATE OR REPLACE FUNCTION refund_credits_atomic(p_user_id uuid, p_amount bigint, p_action text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_credits bigint;
  v_new_balance bigint;
BEGIN
  -- Authorization check: Ensure caller can only modify their own credits
  -- Allow service_role to bypass this check for admin/batch operations
  IF auth.uid() != p_user_id AND COALESCE(current_setting('request.jwt.claim.role', true), '') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Cannot refund credits for other users';
  END IF;  
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  -- Validate action is not null or empty
  IF p_action IS NULL OR p_action = '' THEN
    RAISE EXCEPTION 'Action must be a non-empty string';
  END IF;
  SELECT credits INTO v_current_credits FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  -- Prevent integer overflow (bigint max: 9,223,372,036,854,775,807)
  IF v_current_credits > 9223372036854775807 - p_amount THEN
    RAISE EXCEPTION 'Refund would exceed maximum credits limit';
  END IF;
  v_new_balance := v_current_credits + p_amount;
  UPDATE public.users SET credits = v_new_balance WHERE id = p_user_id;
  INSERT INTO public.credit_logs (user_id, amount, action) VALUES (p_user_id, p_amount, p_action);
  RETURN v_new_balance;
END;
$$;

-- Match Memories Hybrid (UUID Version)
-- Drop old signature with vector, text, float, int
DROP FUNCTION IF EXISTS match_memories_hybrid(vector, text, float, int);
DROP FUNCTION IF EXISTS match_memories_hybrid(vector, text, double precision, int);

create or replace function match_memories_hybrid (
  query_embedding vector(384),
  query_text text,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  similarity float,
  rank float
)
language sql stable
as $$
  select
    memories.id,
    memories.content,
    1 - (memories.embedding <=> query_embedding) as similarity,
    ts_rank(memories.content_tsvector, plainto_tsquery('english', query_text)) as rank
  from public.memories memories
  where (memories.embedding IS NOT NULL AND 1 - (memories.embedding <=> query_embedding) > match_threshold)
  or (memories.content_tsvector IS NOT NULL AND ts_rank(memories.content_tsvector, plainto_tsquery('english', query_text)) > 0)
  order by similarity desc, rank desc
  limit match_count;
$$;

-- Capture Memory Atomic (UUID Version)
DROP FUNCTION IF EXISTS capture_memory_atomic(uuid, int, jsonb, text);
DROP FUNCTION IF EXISTS capture_memory_atomic(uuid, bigint, jsonb, text);
CREATE OR REPLACE FUNCTION capture_memory_atomic(
  p_user_id uuid,
  p_cost bigint,
  p_memories jsonb,
  p_action text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_credits bigint;
  v_new_balance bigint;
  v_memory jsonb;
  v_inserted_ids uuid[] := '{}';  -- Initialize to empty array
  v_id uuid;
BEGIN
  -- Allow service_role to bypass this check for admin/batch operations
  IF auth.uid() != p_user_id AND COALESCE(current_setting('request.jwt.claim.role', true), '') != 'service_role' THEN 
    RAISE EXCEPTION 'Unauthorized'; 
  END IF;  SELECT credits INTO v_current_credits FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF v_current_credits < p_cost THEN RAISE EXCEPTION 'Insufficient credits'; END IF;
  v_new_balance := v_current_credits - p_cost;
  UPDATE public.users SET credits = v_new_balance WHERE id = p_user_id;
  INSERT INTO public.credit_logs (user_id, amount, action) VALUES (p_user_id, -p_cost, p_action);
  
  FOR v_memory IN SELECT * FROM jsonb_array_elements(p_memories) LOOP
    INSERT INTO public.memories (user_id, content, embedding, tags)
    VALUES (
      p_user_id,
      v_memory->>'content',
      CASE WHEN v_memory->>'embedding' IS NOT NULL 
        THEN (v_memory->>'embedding')::vector 
        ELSE NULL 
      END,
      (SELECT array_agg(x) FROM jsonb_array_elements_text(v_memory->'tags') t(x))
    ) RETURNING id INTO v_id;
    v_inserted_ids := array_append(v_inserted_ids, v_id);
  END LOOP;
  
  RETURN jsonb_build_object('status', 'success', 'new_balance', v_new_balance, 'inserted_ids', v_inserted_ids);
END;
$$;
