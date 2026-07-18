# SOP Flow Limpahan — Design Spec

**Tanggal:** 2026-07-18
**Status:** Approved (final setelah iterasi klarifikasi)
**Brain:** [[sop-flow-limpahan]], [[tindak-lanjut-tab]]

## Tujuan

Menyelaraskan alur Paminal → Kabidpropam → Unit tujuan dengan SOP Polri, dengan tetap memakai Gajamada sebagai sumber data pengaduan, tanpa gateway baru.

## Pain point yang dipecahkan

Gajamada saat ini "limpah" = perubahan field `case_position` saja (row pengaduan tetap, Nota Dinas upload sebagai attachment). Konsekuensi yang menyakitkan:

1. **Pemilik asal (Paminal, Kabidpropam) tidak punya visibilitas journey kasus** setelah `case_position` pindah → kasus "menghilang" dari dashboard mereka.
2. **Tidak ada cara enforce read-only** setelah serah-terima → risiko inkonsistensi jika origin unit masih append data terlambat.
3. Status SOP lintas-unit tidak terstruktur — operator harus rekonstruksi manual dari timeline widget Gajamada.

## Prinsip desain

1. **Gajamada timeline = sumber kebenaran lintas-unit** — sudah ada widget timeline (`7761377d7802b8a2f07e200d8cde526b`) dengan field `previous_case_position`, `case_position`, `type`, `attachments`, `status`, `status_alias`, `officer_name`, `subject`, `date_activity`. Tidak perlu tabel perjalanan kasus tambahan.
2. **Read-only enforcement** — setelah `case_position` pindah ke unit lain, origin unit kehilangan hak mutasi. Diterapkan via flag `is_locked` di derived `unit_riwayat`.
3. **Derived views, no mirror tables** — semua struktur internal E-PROPAM yang terkait perjalanan kasus diturunkan dari timeline Gajamada, bukan disimpan duplicate.

## Aliran SOP (revisi 2026-07-18: 3-hop dengan round-trip)

```
[Aduan → Gajamada]
       │
       ▼
[Kasubbid Paminal: Mulai Lidik]  ── timeline entry: status=Laporan Diterima, case_position=PAMINAL
       │
       ▼
[Proses Lidik: 4-Stage] ── timeline auto-update per stage
       │
       ▼
[Gelar Perkara + Hasil] ── timeline entry: status=TERBUKTI/TIDAK_TERKIRIM/PERDAMAIAN
       │
       ├─── TERBUKTI ──► [Simpan Nota Dinas (LHP) di Tab Tindak Lanjut]
       │                                            │
       │                                            ▼
       │                              [Paminal: case_position → KABIDPROPAM]
       │                              → timeline entry: case_position=KABIDPROPAM,
       │                                previous_case_position=PAMINAL
       │                              → unit_riwayat: (PAMINAL.is_locked=true, KABIDPROPAM.is_locked=false)
       │                                            │
       │                                            ▼
       │                              [KABIDPROPAM: review LHP terlampir]
       │                              → TIDAK melimpahkan langsung ke unit tujuan
       │                              → disposisi balik ke KASUBBID PAMINAL
       │                                  dengan catatan "limpahkan ke ..."
       │                              → timeline entry: case_position=PAMINAL,
       │                                previous_case_position=KABIDPROPAM
       │                              → unit_riwayat: (PAMINAL.is_locked=false lagi,
       │                                              KABIDPROPAM.is_locked=true)
       │                                            │
       │                                            ▼
       │                              [KASUBBID PAMINAL: terima disposisi balik]
       │                              → eksekusi limpahan ke unit_X sesuai catatan Kabidpropam
       │                              → timeline entry: case_position=unit_X,
       │                                previous_case_position=PAMINAL
       │                              → unit_riwayat: (PAMINAL.is_locked=true,
       │                                              UnitX.is_locked=false)
       │                                            │
       │                                            ▼
       │                              [UNIT_X: mulai penyidikan]
       │
       └─── TIDAK TERBUKTI ──► [Sprin Henti Lidik + Pdt Ankum + SP2HP2]
                                                │
                                                ▼
                                        [selesai di Paminal —
                                         case_position tetap PAMINAL,
                                         tidak ada serah-terima]
```

## Catatan round-trip

- Paminal sebenarnya **bertindak 2x**: kirim LHP ke Kabidpropam dan limpahkan final ke unit tujuan.
- Kabidpropam **tidak melimpahkan** langsung — hanya me-review + disposisi balik dengan instruksi target.
- Pool unit_riwayat untuk 1 kasus terbukti = 3 row: (PAMINAL, KABIDPROPAM, UnitX). Row Paminal collapse 2 actions ke 1 row (PK = pengaduan+prepetrator+satker_key). Tiap round-trip cuma update `last_event_*` & `is_locked` saja.
- Read-only enforcement di UI toggle otomatis mengikuti `case_position` — user langsung merasakan enable/disable tombol Simpan.

## Data layer

### Hanya tabel baru: `unit_riwayat` (materialized)

PK: `(pengaduan_id, prepetrator_id, satker_key)`. Derived dari Gajamada timeline events. Trigger / derive terjadi setelah sync inbound.

```sql
CREATE TABLE unit_riwayat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id TEXT NOT NULL,
  prepetrator_id TEXT NOT NULL,
  satker_key TEXT NOT NULL,                   -- PAMINAL | KABIDPROPAM | <unit tujuan>

  current_owner TEXT NOT NULL,                -- mirror Gajamada case_position (sumber kebenaran)
  is_locked BOOL GENERATED ALWAYS AS (current_owner <> satker_key) STORED,

  last_event_type TEXT,                        -- lhp_uploaded | disposisi_sent | penugasan_started | ...
  last_event_nomor TEXT,                       -- nomor dokumen terakhir (Nota Dinas, Disposisi, dll)
  last_event_at TIMESTAMPTZ,
  last_status TEXT,                            -- mirror Gajamada status terakhir

  status TEXT NOT NULL DEFAULT 'aktif',        -- aktif | menunggu_disposisi | dalam_penyidikan | selesai
  att_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(pengaduan_id, prepetrator_id, satker_key)
);

CREATE INDEX idx_unit_riwayat_satker      ON unit_riwayat(satker_key);
CREATE INDEX idx_unit_riwayat_owner       ON unit_riwayat(current_owner);
CREATE INDEX idx_unit_riwayat_locked      ON unit_riwayat(satker_key, is_locked);
```

**Cara derive rows (backend route atau Supabase trigger):**

Untuk tiap entry `(case_position, previous_case_position, type, ...)` dari timeline lokal:
- Upsert row untuk `satker_key = case_position` (event IN).
- Upsert row untuk `satker_key = previous_case_position` (event OUT).

Lakukan di `src/lib/timeline-merge.ts:37` (setelah upsert ke `timeline` lokal) atau via Supabase trigger.

### Tidak dibuat

- ❌ `perjalanan_kasus` — Gajamada timeline sendiri.
- ❌ `lhp_kabidpropam`, `disposisi_kabidpropam`, `penugasan_penyidik` — derivable dari timeline events dengan `type` + `previous_case_position` + `case_position`.
- ❌ Extra gateway discovery — pakai gateway yang sudah dikenal (`aa6159...`).

## UI Layer

### Dashboard per-unit (read query model)

**Paminal:**
```ts
// Aktif
SELECT * FROM unit_riwayat
  WHERE satker_key = 'PAMINAL'
    AND is_locked = FALSE
  ORDER BY last_event_at DESC;

// Sudah Dilimpahkan (read-only)
SELECT * FROM unit_riwayat
  WHERE satker_key = 'PAMINAL'
    AND is_locked = TRUE
  ORDER BY last_event_at DESC;
```

**Kabidpropam** — sama, ganti filter `satker_key='KABIDPROPAM'`.

**Unit tujuan** — sama, ganti filter `satker_key=user.unit_key`.

### Enforcement read-only (is_locked)

Tempat yang menerapkan:
- `src/components/pengaduan/aksi-paminal.tsx` — tombol Simpan per blok dokumen; disable bila unit ini `is_locked`.
- Komponen tombol "Selesai" / "Teruskan" di cards lain yang melakukan mutasi ke Gajamada.
- Optional: tampilkan banner `Kasus sudah diserah-terimakan ke X — hubungi unit tujuan untuk perubahan`.

### Detail timeline (read-only journey)

Halaman yang sudah ada (`timeline-card.tsx`, `detail-tabs.tsx Timeline`, `cetak/[id]/page.tsx`) tetap dipakai apa adanya — `getUnifiedTimeline` sudah merge Gajamada + catatan lokal. Tidak ada perubahan UI di sini.

## Files

| File | Perubahan |
|---|---|
| `supabase/migrations/00X_unit_riwayat.sql` | NEW: tabel + index |
| `src/lib/timeline-merge.ts` | EXTEND: setelah upsert `timeline`, juga derive `unit_riwayat` rows |
| `src/components/dashboard/<unit>/page.tsx` | QUERY: `unit_riwayat` per satker + tab Aktif/Locked |
| `src/components/pengaduan/aksi-paminal.tsx` | ENFORCE: disable Simpan bila `is_locked=true` |
| `src/components/pengaduan/aksi-kabid.tsx` | ENFORCE: disable disposisi bila `is_locked` |
| `src/components/pengaduan/aksi-unit.tsx` | ENFORCE: disable aksi unit bila `is_locked` |
| `src/app/api/unit/route.ts` | INCLUDE: saat aksi apapun, return `unit_riwayat.is_locked` flag ke client untuk sync UI state |
| Brain: `brain/roadmap.md` | UPDATE: move deferred items → done |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Gajamada timeline tidak selalu set `previous_case_position` (nullable) | Fallback: anggap previous = derived dari event sebelumnya. Test dengan data real. |
| Unit tujuan — satker_key mapping tidak standard | Tentukan mapping eksplisit di helper `unitToSatkerKey(unit_name)`. Default = nama normalized. |
| Inbound sync lambat (timing) | Update `unit_riwayat` ke level best-effort saat sinkronisasi. UI bisa optimistik dengan client-side cache. |
| Dashboard Paminal akan numpuk `Sudah Dilimpahkan` lama-lama | Filter hanya dalam window 6 bulan default; UI pagination. |
| Catatan lokal vs timeline Gajamada metaphysics | `catatan` table tetap terpisah — bukan event timeline Gajamada. Tetap di-merge di `getUnifiedTimeline`. |

## Out of scope (deferred)

- Audit cross-unit lengkap (semua perjalanan lintas unit dengan filter rentang waktu) — iterate setelah unit dashboard stabil.
- Trigger otomatis Kabidpropam disposisi (event dari Paminal "klik Disposisi" di Kabidpropam) — fase 2.
- Bulk migration backfill `unit_riwayat` dari Gajamada timeline lama — fase 2.

## Status keputusan

- [x] Skema final disetujui (2026-07-18).
- [ ] Migrasi Supabase.
- [ ] Cascade derive `unit_riwayat` di `timeline-merge`.
- [ ] UI per-unit dashboard dengan tab Aktif/Locked.
- [ ] Enforce `is_locked` di komponen mutasi.
- [ ] Brain roadmap update.
