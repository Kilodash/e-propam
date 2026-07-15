-- Konfigurasi layout card per-role (admin configurable)
create table if not exists public.card_layout_config (
  id serial primary key,
  role text not null,
  card_id text not null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(role, card_id)
);

create index if not exists idx_card_layout_role on public.card_layout_config(role, sort_order);

alter table public.card_layout_config enable row level security;

drop policy if exists "Authenticated users can read card_layout" on public.card_layout_config;
create policy "Authenticated users can read card_layout" on public.card_layout_config for select using (auth.role() = 'authenticated');

drop policy if exists "Admins can manage card_layout" on public.card_layout_config;
create policy "Admins can manage card_layout" on public.card_layout_config for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Seed default config for yanduan
insert into public.card_layout_config (role, card_id, enabled, sort_order, config) values
  ('yanduan', 'saran-yanduan', true, 1, '{}'),
  ('yanduan', 'distribusi', true, 2, '{}'),
  ('yanduan', 'override-distribusi', true, 3, '{}'),
  ('yanduan', 'override-distribusi-status', false, 4, '{"statusOptions":["Lidik","Proses Lidik","Gelar Lidik","Gelar Perkara","Selesai"]}'),
  ('yanduan', 'kembalikan-surat', true, 5, '{"kembalikanTargets":["mabes","yanduan","kabid","kasatker","operator"]}'),
  ('admin', 'saran-yanduan', true, 1, '{}'),
  ('admin', 'distribusi', true, 2, '{"distributionTargets":["kabid","paminal","provos","wabprof","rehabpers"]}'),
  ('admin', 'override-distribusi', true, 3, '{}'),
  ('admin', 'override-distribusi-status', false, 4, '{"statusOptions":["Lidik","Proses Lidik","Gelar Lidik","Gelar Perkara","Selesai"]}'),
  ('admin', 'kembalikan-surat', true, 5, '{"kembalikanTargets":["mabes","yanduan","kabid","kasatker","operator"]}'),
  ('kabid', 'distribusi', true, 1, '{}'),
  ('kabid', 'kembalikan-surat', true, 2, '{"kembalikanTargets":["yanduan","kasatker","operator"]}'),
  ('paminal', 'proses-paminal', true, 2, '{}'),
  ('paminal', 'distribusi', true, 1, '{}'),
  ('provos', 'proses-provos', true, 1, '{}'),
  ('provos', 'distribusi', true, 2, '{}'),
  ('wabprof', 'proses-wabprof', true, 1, '{}'),
  ('wabprof', 'distribusi', true, 2, '{}'),
  ('rehabpers', 'proses-rehabpers', true, 1, '{}'),
  ('rehabpers', 'distribusi', true, 2, '{}')
on conflict (role, card_id) do update set sort_order = excluded.sort_order, config = excluded.config;
