-- Unit Riwayat: per-unit materialized summary of Gajamada timeline
-- Purpose: enable read-only tracking per-unit setelah serah-terima (limpahan/disposisi)
-- Sumber kebenaran kasus = Gajamada case_position (mirror di current_owner)

CREATE TABLE IF NOT EXISTS unit_riwayat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id TEXT NOT NULL,
  prepetrator_id TEXT NOT NULL,
  satker_key TEXT NOT NULL,

  current_owner TEXT NOT NULL,
  is_locked BOOLEAN GENERATED ALWAYS AS (current_owner <> satker_key) STORED,

  last_event_type TEXT,
  last_event_nomor TEXT,
  last_event_at TIMESTAMPTZ,
  last_status TEXT,
  status TEXT NOT NULL DEFAULT 'aktif',
  att_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(pengaduan_id, prepetrator_id, satker_key)
);

CREATE INDEX IF NOT EXISTS idx_unit_riwayat_satker
  ON unit_riwayat(satker_key);
CREATE INDEX IF NOT EXISTS idx_unit_riwayat_owner
  ON unit_riwayat(current_owner);
CREATE INDEX IF NOT EXISTS idx_unit_riwayat_locked
  ON unit_riwayat(satker_key, is_locked);
CREATE INDEX IF NOT EXISTS idx_unit_riwayat_updated
  ON unit_riwayat(satker_key, updated_at DESC);

COMMENT ON TABLE unit_riwayat IS
  'Per-unit materialized summary of Gajamada timeline. Source of truth = case_position Gajamada.';
COMMENT ON COLUMN unit_riwayat.is_locked IS
  'true when current_owner (case_position) is no longer this satker_key → read-only enforcement';
