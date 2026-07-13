-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('admin','yanduan','kabid','paminal','provos','wabprof','rehabpers','polres','wassidik')),
  unit_name text,
  polda_code integer default 6013,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can read all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert profiles" on public.profiles
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- pengaduan table (cached from Gajamada)
create table public.pengaduan (
  id text primary key,
  prepetrator_id text not null,
  pengirim text,
  phone_no text,
  email text,
  category text,
  content text,
  summary text,
  status_label text,
  case_position text,
  disposisi_polda text,
  disposisi_polres text,
  disposisi_police_function text,
  polda_code integer,
  source text,
  source_alias text,
  created_date timestamptz,
  updated_at timestamptz,
  synced_at timestamptz default now()
);

create index idx_pengaduan_police_function on public.pengaduan(disposisi_police_function);
create index idx_pengaduan_status on public.pengaduan(status_label);
create index idx_pengaduan_prepetrator on public.pengaduan(prepetrator_id);

alter table public.pengaduan enable row level security;

create policy "Authenticated users can read pengaduan" on public.pengaduan
  for select using (auth.role() = 'authenticated');

-- timeline table
create table public.timeline (
  id uuid primary key default uuid_generate_v4(),
  prepetrator_id text not null,
  status text,
  status_alias text,
  case_position text,
  date_activity timestamptz,
  handling_progress text,
  officer_name text,
  attachments jsonb default '[]'::jsonb,
  synced_at timestamptz default now()
);

create index idx_timeline_prepetrator on public.timeline(prepetrator_id);

alter table public.timeline enable row level security;

create policy "Authenticated users can read timeline" on public.timeline
  for select using (auth.role() = 'authenticated');

-- attachments table
create table public.attachments (
  id text primary key,
  pengaduan_id text references public.pengaduan(id) on delete cascade,
  url text not null,
  file_name text,
  file_type text,
  created_at timestamptz default now()
);

alter table public.attachments enable row level security;

create policy "Authenticated users can read attachments" on public.attachments
  for select using (auth.role() = 'authenticated');

-- unit_mapping table (normalize Gajamada unit names)
create table public.unit_mapping (
  id serial primary key,
  gajamada_name text not null unique,
  normalized_name text not null,
  police_function text,
  satker_level text check (satker_level in ('subbid','subbag','polres','wassidik')),
  created_at timestamptz default now()
);

alter table public.unit_mapping enable row level security;

create policy "Authenticated users can read unit_mapping" on public.unit_mapping
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage unit_mapping" on public.unit_mapping
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- sync_log table
create table public.sync_log (
  id serial primary key,
  direction text not null check (direction in ('inbound','outbound')),
  status text not null check (status in ('success','error','in_progress')),
  records_count integer default 0,
  error_message text,
  started_at timestamptz default now(),
  finished_at timestamptz
);

alter table public.sync_log enable row level security;

create policy "Admins can read sync_log" on public.sync_log
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Auto-create profile on user signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, unit_name)
  values (
    new.id,
    new.email,
    'yanduan',
    null
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
