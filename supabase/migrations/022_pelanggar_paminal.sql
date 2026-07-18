-- 022_pelanggar_paminal.sql

CREATE TABLE IF NOT EXISTS public.dokumen_perkara (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id TEXT REFERENCES public.pengaduan(id) ON DELETE CASCADE,
  prepetrator_id TEXT,
  doc_type TEXT NOT NULL,
  nomor TEXT NOT NULL,
  tanggal DATE,
  keterangan TEXT,
  stage TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

ALTER TABLE public.dokumen_perkara ADD COLUMN IF NOT EXISTS prepetrator_id TEXT;

CREATE INDEX IF NOT EXISTS idx_dokumen_perkara_pengaduan ON public.dokumen_perkara(pengaduan_id);
CREATE INDEX IF NOT EXISTS idx_dokumen_perkara_pengaduan_doc ON public.dokumen_perkara(pengaduan_id, doc_type, created_at DESC);

ALTER TABLE public.dokumen_perkara ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read dokumen_perkara" ON public.dokumen_perkara;
CREATE POLICY "Authenticated users can read dokumen_perkara" ON public.dokumen_perkara FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert dokumen_perkara" ON public.dokumen_perkara;
CREATE POLICY "Authenticated users can insert dokumen_perkara" ON public.dokumen_perkara FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.pelanggar_paminal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id TEXT NOT NULL REFERENCES public.pengaduan(id) ON DELETE CASCADE,
  prepetrator_id TEXT NOT NULL,
  client_key TEXT NOT NULL,
  nama TEXT,
  pangkat TEXT,
  nrp TEXT,
  jabatan TEXT,
  kesatuan TEXT,
  functional TEXT,
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  telpon TEXT,
  pendidikan TEXT,
  jenis_kelamin TEXT,
  wujud TEXT,
  kategori TEXT,
  sub_kategori TEXT,
  pasal_disiplin TEXT[] DEFAULT '{}',
  pasal_kke TEXT[] DEFAULT '{}',
  prepetrator_type TEXT,
  prepetrator_description TEXT,
  gajamada_synced_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pengaduan_id, prepetrator_id, client_key)
);

CREATE INDEX IF NOT EXISTS idx_pelanggar_paminal_pengaduan ON public.pelanggar_paminal(pengaduan_id);
CREATE INDEX IF NOT EXISTS idx_pelanggar_paminal_prepetrator ON public.pelanggar_paminal(prepetrator_id);
CREATE INDEX IF NOT EXISTS idx_pelanggar_paminal_updated ON public.pelanggar_paminal(pengaduan_id, updated_at DESC);

COMMENT ON TABLE public.pelanggar_paminal IS 'Snapshot data pelaku yang diedit Paminal via save_pelanggar. Prioritas tampil di DetailTerlapor jika ada baris di sini.';
COMMENT ON COLUMN public.pelanggar_paminal.client_key IS 'React list key (UUID) - multi-pelaku per kasus disimpan sebagai baris terpisah dengan key berbeda.';

ALTER TABLE public.pelanggar_paminal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read pelanggar_paminal" ON public.pelanggar_paminal;
CREATE POLICY "Authenticated users can read pelanggar_paminal" ON public.pelanggar_paminal FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can upsert pelanggar_paminal" ON public.pelanggar_paminal;
CREATE POLICY "Authenticated users can upsert pelanggar_paminal" ON public.pelanggar_paminal FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
