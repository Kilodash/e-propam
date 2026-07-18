-- 020_pelanggaran_mapping.sql
DROP TABLE IF EXISTS public.pelanggaran_mapping;

CREATE TABLE public.pelanggaran_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wujud TEXT NOT NULL UNIQUE,
  kategori TEXT,
  sub_kategori TEXT,
  pasal_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pelanggaran_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read pelanggaran_mapping" ON public.pelanggaran_mapping;
CREATE POLICY "Authenticated users can read pelanggaran_mapping" ON public.pelanggaran_mapping
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage pelanggaran_mapping" ON public.pelanggaran_mapping;
CREATE POLICY "Admins can manage pelanggaran_mapping" ON public.pelanggaran_mapping
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
