-- Track where pengaduan came from before override/distribusi
alter table public.pengaduan
  add column if not exists previous_case_position text;
