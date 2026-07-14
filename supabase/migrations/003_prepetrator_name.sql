-- Add prepetrator_name column

alter table public.pengaduan
  add column if not exists prepetrator_name text;
