-- Fix API Keys Table Schema
-- Run this in Supabase Dashboard -> SQL Editor

-- The column "_api_key_backup" seems to be a legacy column that is enforcing NOT NULL.
-- We need to make it nullable (optional) so the new backend can create keys without it.

alter table public.api_keys alter column "_api_key_backup" drop not null;

-- Optional: If you want to clean it up completely, you can run:
-- alter table public.api_keys drop column "_api_key_backup";
