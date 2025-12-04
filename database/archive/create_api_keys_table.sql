-- Create a table for API keys
create table if not exists api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  key_hash text not null unique, -- Hashed using bcrypt or similar
  key_prefix text not null check (length(key_prefix) = 4), -- First 4 characters for UI display
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_used_at timestamp with time zone
);

-- Enable RLS
alter table api_keys enable row level security;

-- Policy: Users can see their own keys
drop policy if exists "Users can view their own keys" on api_keys;
create policy "Users can view their own keys"
  on api_keys for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own keys
drop policy if exists "Users can create their own keys" on api_keys;
create policy "Users can create their own keys"
  on api_keys for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own keys
drop policy if exists "Users can delete their own keys" on api_keys;
create policy "Users can delete their own keys"
  on api_keys for delete
  using (auth.uid() = user_id);

-- Policy: Users can update their own keys (field restrictions enforced by trigger)
drop policy if exists "Users can update their own keys" on api_keys;
create policy "Users can update their own keys"
  on api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: Prevent modification of security-critical fields
-- Only 'name' and 'last_used_at' can be updated by users
create or replace function prevent_api_key_tampering()
returns trigger as $$
begin
  -- Prevent modification of immutable fields
  if OLD.id != NEW.id then
    raise exception 'Cannot modify id';
  end if;
  
  if OLD.user_id != NEW.user_id then
    raise exception 'Cannot modify user_id';
  end if;
  
  if OLD.key_hash != NEW.key_hash then
    raise exception 'Cannot modify key_hash - API keys are immutable';
  end if;
  
  if OLD.key_prefix != NEW.key_prefix then
    raise exception 'Cannot modify key_prefix - API keys are immutable';
  end if;
  
  if OLD.created_at != NEW.created_at then
    raise exception 'Cannot modify created_at';
  end if;
  
  -- Allow updates to name and last_used_at only
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists enforce_api_key_immutability on api_keys;
create trigger enforce_api_key_immutability
  before update on api_keys
  for each row
  execute function prevent_api_key_tampering();