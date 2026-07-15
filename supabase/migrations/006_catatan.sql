-- Catatan: local notes added by E-Propam users per pengaduan
create table if not exists public.catatan (
  id uuid primary key default uuid_generate_v4(),
  pengaduan_id text not null references public.pengaduan(id) on delete cascade,
  prepetrator_id text not null,
  author_email text not null,
  author_role text not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_catatan_pengaduan on public.catatan(pengaduan_id);
create index if not exists idx_catatan_prepetrator on public.catatan(prepetrator_id);
create index if not exists idx_catatan_created on public.catatan(created_at desc);

alter table public.catatan enable row level security;

drop policy if exists "Authenticated users can read catatan" on public.catatan;
create policy "Authenticated users can read catatan" on public.catatan for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert catatan" on public.catatan;
create policy "Authenticated users can insert catatan" on public.catatan for insert with check (auth.role() = 'authenticated');
