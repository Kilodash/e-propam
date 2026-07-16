create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table public.app_settings enable row level security;

create policy "app_settings_admin_read" on public.app_settings
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "app_settings_admin_write" on public.app_settings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
