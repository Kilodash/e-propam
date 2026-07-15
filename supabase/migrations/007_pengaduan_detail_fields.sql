-- Add columns for rich detail from Gajamada

alter table public.pengaduan
  add column if not exists sub_category text,
  add column if not exists sub_status text,
  add column if not exists pengirim_address text,
  add column if not exists terlapor_name text,
  add column if not exists terlapor_rank text,
  add column if not exists terlapor_position text,
  add column if not exists terlapor_nrp text,
  add column if not exists terlapor_division text;
