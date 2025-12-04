-- Layer 3: VeriSnap Tables

create table public.image_provenance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_hash text not null,
  gps_data jsonb,
  filename text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.image_provenance enable row level security;

-- Policy
create policy "Users can insert their own provenance data"
on public.image_provenance for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own provenance data"
on public.image_provenance for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own provenance data"
on public.image_provenance for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own provenance data"
on public.image_provenance for delete
to authenticated
using (auth.uid() = user_id);
