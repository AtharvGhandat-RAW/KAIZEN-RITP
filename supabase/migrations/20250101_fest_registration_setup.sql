-- 1. Create table for Global Fest Settings
create table if not exists public.fest_settings (
  id uuid not null default gen_random_uuid() primary key,
  registration_start_time timestamptz,
  registration_end_time timestamptz,
  is_registration_live boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert default row if not exists (singleton pattern)
insert into public.fest_settings (is_registration_live)
select false
where not exists (select 1 from public.fest_settings);

-- 2. Update Events table for per-event registration windows
alter table public.events 
add column if not exists registration_start_date timestamptz,
add column if not exists registration_end_date timestamptz;

-- 3. Update Profiles to track Fest Registration
alter table public.profiles
add column if not exists fest_registration_id text unique, -- The unique code sent via email
add column if not exists is_fest_registered boolean default True,
add column if not exists fest_payment_status text default 'Working', -- pending, completed, rejected
add column if not exists fest_payment_proof_url text;

-- 4. Create Fest Registrations table (optional, but good for separation if needed, 
-- but user asked for "Fest Registration Form", we can link it to profiles directly or a new table.
-- Let's stick to updating profiles as the "User" is the entity registering for the fest first).

-- However, to keep it clean and allow "Fest Registration" to be a distinct action:
create table if not exists public.fest_registrations (
  id uuid not null default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  payment_status text default 'pending', -- pending, completed, rejected
  payment_proof_url text,
  registration_code text unique, -- The generated code
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table public.fest_settings enable row level security;
create policy "Public read access to fest settings"
  on public.fest_settings for select
  to public
  using (true);

create policy "Admin write access to fest settings"
  on public.fest_settings for all
  to authenticated
  using ( auth.jwt() ->> 'email' in (select email from public.profiles where role = 'admin') ); -- Assuming role check logic

-- Function to generate unique Fest ID (e.g., KAIZEN-2025-XXXX)
create or replace function generate_fest_id() returns text as $$
declare
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F}';
  result text := 'KZN-';
  i integer;
begin
  for i in 1..6 loop
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  end loop;
  return result;
end;
$$ language ;

-- Trigger to auto-generate code on approval
create or replace function handle_fest_registration_approval() returns trigger as $$
begin
  -- If status changes to 'completed' and no code exists
  if new.payment_status = 'completed' and old.payment_status != 'completed' and new.registration_code is null then
    new.registration_code := generate_fest_id();
    -- Here you would typically trigger an email via Edge Function (handled in app logic usually)
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_fest_registration_approval
  before update on public.fest_registrations
  for each row
  execute function handle_fest_registration_approval();
