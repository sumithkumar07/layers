-- Fix RLS policies for transactions table
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Allow Users to Insert their own transactions (for Create Order)
drop policy if exists "Users can insert their own transactions" on public.transactions;
create policy "Users can insert their own transactions" on public.transactions 
for insert with check (auth.uid() = user_id);

-- 2. Allow Users to Update their own transactions (for Verify Payment)
drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions" on public.transactions 
for update using (auth.uid() = user_id);

-- 3. Ensure Select policy exists (already present but good to confirm)
drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions" on public.transactions 
for select using (auth.uid() = user_id);
