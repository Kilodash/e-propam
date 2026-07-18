-- 019_fallback_position.sql
ALTER TABLE public.unit_mapping ADD COLUMN IF NOT EXISTS fallback_position TEXT;
