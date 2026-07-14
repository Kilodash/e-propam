-- Add columns for richer table display

alter table public.pengaduan
  add column if not exists reporter_nik text,
  add column if not exists alamat_kejadian text,
  add column if not exists tgl_kejadian timestamptz;
