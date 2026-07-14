-- Add columns for Aksi Yanduan

alter table public.pengaduan
  add column if not exists saran_kabid text,
  add column if not exists override_unit text,
  add column if not exists override_alasan text,
  add column if not exists override_at timestamptz,
  add column if not exists override_by text,
  add column if not exists kembalikan_alasan text,
  add column if not exists kembalikan_at timestamptz,
  add column if not exists kembalikan_by text;

-- RLS for these is inherited from pengaduan table (no change needed).
