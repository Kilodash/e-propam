# Paminal Overhaul — Design Spec

## Objective

Restruktur Card Aksi Paminal (pecah monolit ~970 baris jadi modul terpisah) + implementasi Tab Tindak Lanjut sesuai SOP, Tab Rekap ringkasan, persistence data blok+terlapor, dan sync ke Gajamada (field alignment dari HAR gap analysis).

## Scope

| # | Item | Status |
|---|------|--------|
| 1 | Pecah `aksi-paminal.tsx` ke modul per-tab | In scope |
| 2 | Tab Tindak Lanjut (Terbukti→limpahan, Tidak Terbukti→sprin henti+Ankum) | In scope |
| 3 | Tab Rekap (ringkasan lengkap + kondisi read-only setelah selesai) | In scope |
| 4 | Persistence blok per-stage + snapshot terlapor (`024_paminal_persistence.sql`) | In scope |
| 5 | Sync Gajamada (field alignment HAR, handle pelimpahan via 1-call) | In scope |
| 6 | History jejak unit via timeline pencarian | In scope |
| 7 | Provos/Wabprof/Polres | Deferred (Fase 2) |

## Architecture

### 1. Module Breakdown

`aksi-paminal.tsx` dipecah menjadi:

```
src/components/pengaduan/
  aksi-paminal.tsx            → index/host component (orchestrator)
  paminal/
    proses-lidik-tab.tsx       → Tab Proses Lidik
    pelaporan-tab.tsx          → Tab Pelaporan
    tindak-lanjut-tab.tsx      → Tab Tindak Lanjut (overhaul)
    rekap-tab.tsx              → Tab Rekap (overhaul)
    pelanggar-editor.tsx       → Editor identitas pelanggar (existing, refactor)
    doc-block.tsx              → renderDocBlock reusable
```

**Host component** (`aksi-paminal.tsx`) tetap sebagai entry point, menyediakan:
- State bersama (stage, hasil, pelanggarList, tlList, dll)
- Router refresh
- Context wrapper atau prop drilling sederhana (tidak perlu Zustand/Redux)

**Setiap tab module** menerima props: state, setters, callbacks.

### 2. Tab Tindak Lanjut — SOP Flow

#### Terbukti
1. Hasil=Terbukti, pilih target pelimpahan (Provos/Wabprof/Polres/Satker)
2. Status per target: Provos=`LIMPAH KE UNIT PROVOS`, Wabprof=`LIMPAH SUBBIDAWBPROF`, Polres=`Laporan Dikirim ke Polres`, lainnya=`Laporan Dikirim ke Satker`
3. `case_position` = `gajamada_name` unit tujuan
4. Dokumen pelimpahan: satker Polda→`nota_dinas`, Polres/Brimob/Polair→`surat`
5. 1 gateway call `aa6159...` langsung ke status limpah (tidak 2 tahap selesai→limpah)

#### Tidak Terbukti
1. Hasil=Tidak Terbukti
2. Wajib upload `sprin_henti` (Sprin Henti Lidik)
3. Wajib upload `pem_ankum` (Pemberitahuan ke Ankum)
4. Status: `TIDAK TERBUKTI`
5. Case position tetap di unit Paminal (tidak dilimpahkan)
6. 1 gateway call update status

### 3. Tab Rekap

Ringkasan read-only yang menampilkan:
- Tahap (Perencanaan/Pengumpulan/Pengolahan/Pelaporan)
- Gelar Perkara (tanggal + notulen)
- Hasil (Terbukti/Perdamaian/Tidak Terbukti)
- Tindak Lanjut (checked items + nomor)
- Pelanggar (nama + NRP + pasal)
- Dokumen (list semua doc_type + nomor)
- Timeline link ke catatan

Setelah proses selesai (`isDone`), tab Rekap menjadi view utama.

### 4. Persistence — Migration 024

`supabase/migrations/024_paminal_persistence.sql`:

```sql
-- Snapshot pelanggar per pengaduan
CREATE TABLE IF NOT EXISTS pelanggar_paminal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id UUID NOT NULL REFERENCES pengaduan(id) ON DELETE CASCADE,
  data JSONB NOT NULL,         -- full snapshot PelanggarItem
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add blok per-stage persistence (dokumen_perkara already exists)
ALTER TABLE dokumen_perkara ADD COLUMN IF NOT EXISTS stage_data JSONB;
ALTER TABLE dokumen_perkara ADD COLUMN IF NOT EXISTS prepetrator_id TEXT;
```

### 5. Sync Gajamada — Field Alignment

Berdasarkan HAR gap analysis:

| Field HAR | Current | Fix |
|-----------|---------|-----|
| `graduation_year` | not sent | add from pangkat→tahun mapping |
| `gajamada_updated_at` | not handled | capture from response |
| `sender_name` | hardcoded | use session user name |
| `sender_nrp` | hardcoded | use session user NRP |
| `sender_jabatan` | not sent | add from session |
| `widgetName` | "E-PROPAM Attachment" | "Data Terlapor" for save_pelanggar |

## API Changes

### `/api/unit` — new action: `limpahkan`

```json
{
  "action": "limpahkan",
  "pengaduanId": "...",
  "prepetratorId": "...",
  "target": "UNIT PROVOS POLDA JAWA BARAT",
  "targetStatus": "LIMPAH KE UNIT PROVOS",
  "dokumen": [{ "doc_type": "nota_dinas", ... }],
  "catatan": "Limpahan karena terbukti"
}
```

Gateway call: 1-call `aa6159...` dengan status limpah + case_position target.

### `/api/unit` — `pelaporan` action update

- Handle `hasil=tidak_terbukti`: status=`TIDAK TERBUKTI`, case_position tetap
- Save `pelanggar_paminal` snapshot
- Update `sender_*` fields from session

## Implementation Order

1. Migration `024_paminal_persistence.sql`
2. Refactor: pecah monolit jadi modul per-tab
3. Tab Tindak Lanjut overhaul (Terbukti + Tidak Terbukti flow)
4. Tab Rekap overhaul
5. Gateway - update `pelaporan` action + new `limpahkan` action
6. Field alignment HAR
7. History timeline enhancement
8. Doc templates: `surat`, `sprin_henti`, `str_jukrah` already added
9. Admin template-nomor labels already added

## Data Flow

```
User input form → handleStageUpdate() → POST /api/unit
  → Supabase update + dokumen_perkara insert + catatan insert
  → Gateway call to Gajamada (1 call untuk final)
  → Response → router.refresh()

User simpan pelanggar → handleSavePelanggar() → POST /api/unit?action=save_pelanggar
  → Gateway save_pelanggar (widgetName="Data Terlapor")
  → Supabase pelanggar_paminal snapshot
```

## Status Mapping

| Kondisi | Status Label | case_position |
|---------|-------------|---------------|
| Terbukti → Provos | LIMPAH KE UNIT PROVOS | UNIT PROVOS POLDA JAWA BARAT |
| Terbukti → Wabprof | LIMPAH SUBBIDAWBPROF | SUBBID WABPROF POLDA JAWA BARAT |
| Terbukti → Polres | Laporan Dikirim ke Polres | gajamada_name Polres |
| Terbukti → Satker lain | Laporan Dikirim ke Satker | gajamada_name Satker |
| Tidak Terbukti | TIDAK TERBUKTI | KASUBBID PAMINAL POLDA JAWA BARAT |
| Perdamaian | RESTORATIVE JUSTICE | KASUBBID PAMINAL POLDA JAWA BARAT |

## Component Props Interface

```typescript
interface TindakLanjutTabProps {
  hasil: string
  stage: string
  tlList: TindakLanjutItem[]
  pelanggarList: PelanggarItem[]
  onToggleTl: (idx: number) => void
  onSetTlNomor: (idx: number, nomor: string) => void
  onSalinRekap: () => Promise<void>
  copied: boolean
  pelimpahan: string
  onSetPelimpahan: (v: string) => void
  unitOptions: { value: string; label: string }[]
  isDone: boolean
}

interface RekapTabProps {
  stage: string
  hasil: string
  gelarBlock: DocBlock
  tlList: TindakLanjutItem[]
  pelanggarList: PelanggarItem[]
  error: string | null
  success: string | null
  skipGajamada: boolean
  onToggleSkip: (v: boolean) => void
  onSubmit: () => Promise<void>
  loading: boolean
  isDone: boolean
  pengaduan: any
}
```
