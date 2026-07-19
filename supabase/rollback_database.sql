-- 023: drop graduation_year column from pelanggar_paminal
ALTER TABLE IF EXISTS public.pelanggar_paminal DROP COLUMN IF EXISTS graduation_year;

-- 022: drop pelanggar_paminal table + prepetrator_id from dokumen_perkara
DROP TABLE IF EXISTS public.pelanggar_paminal CASCADE;
ALTER TABLE public.dokumen_perkara DROP COLUMN IF EXISTS prepetrator_id;

-- 021: drop unit_riwayat table
DROP TABLE IF EXISTS public.unit_riwayat CASCADE;
