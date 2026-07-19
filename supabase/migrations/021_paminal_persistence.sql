-- 021_paminal_persistence.sql
-- Persistence untuk blok per-stage + snapshot terlapor

ALTER TABLE public.dokumen_perkara ADD COLUMN IF NOT EXISTS prepetrator_id TEXT;

CREATE TABLE IF NOT EXISTS public.pelanggar_paminal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id TEXT NOT NULL REFERENCES public.pengaduan(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pelanggar_paminal_pengaduan ON public.pelanggar_paminal(pengaduan_id);

ALTER TABLE public.pelanggar_paminal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read pelanggar_paminal" ON public.pelanggar_paminal;
CREATE POLICY "Authenticated users can read pelanggar_paminal" ON public.pelanggar_paminal
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert pelanggar_paminal" ON public.pelanggar_paminal;
CREATE POLICY "Authenticated users can insert pelanggar_paminal" ON public.pelanggar_paminal
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update pelanggar_paminal" ON public.pelanggar_paminal;
CREATE POLICY "Authenticated users can update pelanggar_paminal" ON public.pelanggar_paminal
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete pelanggar_paminal" ON public.pelanggar_paminal;
CREATE POLICY "Authenticated users can delete pelanggar_paminal" ON public.pelanggar_paminal
  FOR DELETE USING (auth.role() = 'authenticated');
