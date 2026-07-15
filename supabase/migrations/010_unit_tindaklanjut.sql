-- 010_unit_tindaklanjut.sql
-- Add internal report source fields + buku_register + dokumen_perkara

ALTER TABLE public.pengaduan ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE public.pengaduan ADD COLUMN IF NOT EXISTS source_unit TEXT;
ALTER TABLE public.pengaduan ALTER COLUMN source SET DEFAULT 'gajamada';

-- Buku Register — sequential document numbering per unit/type/year
CREATE TABLE IF NOT EXISTS public.buku_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unit, doc_type, year)
);

ALTER TABLE public.buku_register ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read buku_register" ON public.buku_register;
CREATE POLICY "Authenticated users can read buku_register" ON public.buku_register
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert buku_register" ON public.buku_register;
CREATE POLICY "Authenticated users can insert buku_register" ON public.buku_register
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update buku_register" ON public.buku_register;
CREATE POLICY "Authenticated users can update buku_register" ON public.buku_register
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Dokumen Perkara — documents attached to pengaduan
CREATE TABLE IF NOT EXISTS public.dokumen_perkara (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id TEXT REFERENCES public.pengaduan(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  nomor TEXT NOT NULL,
  tanggal DATE,
  keterangan TEXT,
  stage TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_dokumen_perkara_pengaduan ON public.dokumen_perkara(pengaduan_id);

ALTER TABLE public.dokumen_perkara ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read dokumen_perkara" ON public.dokumen_perkara;
CREATE POLICY "Authenticated users can read dokumen_perkara" ON public.dokumen_perkara
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert dokumen_perkara" ON public.dokumen_perkara;
CREATE POLICY "Authenticated users can insert dokumen_perkara" ON public.dokumen_perkara
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
