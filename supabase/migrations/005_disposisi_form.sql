-- Add fields for Disposisi form (Lembar Disposisi)

alter table public.pengaduan
  add column if not exists telaah boolean default false,
  add column if not exists telaah_at timestamptz,
  add column if not exists kelengkapan boolean default false,
  add column if not exists kelengkapan_at timestamptz,
  add column if not exists disposisi_satker_tujuan text,
  add column if not exists disposisi_satker_at timestamptz;
