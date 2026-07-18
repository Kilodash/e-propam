# SOP Flow Limpahan Implementation Plan (Tahapan A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build read-only tracking lintas-unit dengan Gajamada timeline sebagai sumber kebenaran. Tambah `unit_riwayat` materialized, cascade-nya dari timeline ingest, enforce `is_locked` di komponen mutasi, dan UI dashboard per-unit dengan tab Aktif/Locked.

**Architecture:** Single new SQL table (`unit_riwayat`) + helper yang derive rows dari Gajamada timeline events di `src/lib/timeline-merge.ts:37`. Tidak ada mutation baru ke Gajamada — pakai gateway yang sudah dikenal. Read-only enforcement via flag `is_locked` di setiap tombol mutasi (aksi-paminal/kabid/unit).

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL), React 19, Tailwind v4, TypeScript 5, lucide-react icons.

## Global Constraints

- `gajamada_name` immutable (per [[unit-catalog]]); hanya `normalized_name` editable.
- Status pattern-based via `categorizeStatus()` di `src/lib/status-category.ts`.
- Tidak ada commit/push kecuali user eksplisit memerintahkan (override umum AGENTS.md).
- Semua brain update via `brain` CLI, bukan hand-edit.
- Sync inbound (`src/lib/gajamada/sync.ts`) TIDAK diubah; cascade disisipkan di `src/lib/timeline-merge.ts`.
- UI: kompak `text-xs`, `h-8` button, `p-2` card, neutral dark (`bg-[#1E293B]`, `border-gray-600`, `text-gray-200`).
- Role-based access tetap — UI per-unit hanya menampilkan kasus yang boleh diakses role tsb.
- `is_locked` = strict UI-side disabling pada tombol mutasi; backend tetap menerima request → tetap ada validasi server-side di API route.

## File Structure

| File | Tanggung Jawab |
|---|---|
| `supabase/migrations/00X_unit_riwayat.sql` | Skema tabel + index + trigger cascade |
| `src/lib/unit-satker-key.ts` | helper `unitToSatkerKey()` map unit name → satker_key |
| `src/lib/timeline-merge.ts` | EXTEND: cascade upsert ke `unit_riwayat` setelah sync `timeline` |
| `src/app/api/unit-riwayat/route.ts` | GET endpoint untuk dashboard per-unit |
| `src/lib/api-client.ts` (atau extend existing) | client wrapper untuk fetch `unit_riwayat` |
| `src/components/pengaduan/aksi-paminal.tsx` | EXTEND: cek `is_locked` di Simpan |
| `src/components/pengaduan/aksi-kabid.tsx` | EXTEND: cek `is_locked` di tombol disposisi |
| `src/components/pengaduan/aksi-unit.tsx` | EXTEND: cek `is_locked` di tombol aksi unit |
| `src/app/(unit)/paminal/page.tsx` | tambah tab Aktif/Locked |
| `src/app/(unit)/kabidpropam/page.tsx` | tambah tab Aktif/Locked |
| `brain/roadmap.md` | update status item baru |
| `docs/superpowers/specs/2026-07-18-sop-flow-limpahan-design.md` | (sudah ada) referensi |

---

### Task 1: SQL Migration — tabel `unit_riwayat`

**Files:**
- Create: `supabase/migrations/00X_unit_riwayat.sql` (X = next sequential number; cek `ls supabase/migrations` sebelumnya)

**Interfaces:**
- Produces: tabel `unit_riwayat` dengan PK `(pengaduan_id, prepetrator_id, satker_key)` dan GENERATED kolom `is_locked`.

- [ ] **Step 1: Cek migrasi terakhir**

```bash
ls supabase/migrations
```

- [ ] **Step 2: Tulis migrasi baru `00X_unit_riwayat.sql`**

```sql
-- unit_riwayat: per-unit materialized summary of Gajamada timeline
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
```

- [ ] **Step 3: Terapkan migrasi ke Supabase lokal/dev**

Gunakan Supabase CLI atau langsung jalankan SQL via dashboard Supabase untuk environment yang relevan. Konfirmasi tabel ada di `psql` atau Supabase Studio.

Expected: tabel muncul di schema, dengan 4 index. Lanjut Task 2.

---

### Task 2: Helper `unitToSatkerKey`

**Files:**
- Create: `src/lib/unit-satker-key.ts`

**Interfaces:**
- Produces: `unitToSatkerKey(gajamada_name: string): string` returning canonical satker_key (`"PAMINAL"`, `"KABIDPROPAM"`, atau nama unit lengkap dinormalisasi).

- [ ] **Step 1: Tulis helper**

```typescript
const STATIONARY_KEYS = new Set([
  "KASUBBID PAMINAL POLDA JAWA BARAT",
  "KAUR BINPAM SUBBID PAMINAL POLDA JAWA BARAT",
  "KABID PROPAM POLDA JAWA BARAT",
  "KABIDPROPAM POLDA JAWA BARAT",
])

export type SatkerKey = "PAMINAL" | "KABIDPROPAM" | string

export function unitToSatkerKey(gajamadaName: string): SatkerKey {
  const n = (gajamadaName || "").toUpperCase().trim()
  if (!n) return "UNKNOWN"
  if (STATIONARY_KEYS.has(n) || /PAMINAL/.test(n)) return "PAMINAL"
  if (/KABID\s*PROPAM/.test(n)) return "KABIDPROPAM"
  return n
}
```

- [ ] **Step 2: Verifikasi ketik-typescript**

```bash
npx tsc --noEmit src/lib/unit-satker-key.ts
```

Expected: no errors.

---

### Task 3: Cascade derive `unit_riwayat` di `timeline-merge.ts`

**Files:**
- Modify: `src/lib/timeline-merge.ts:7-49` — tambah cascade derive setelah upsert `timeline` lokal.

**Interfaces:**
- Consumes: helper dari Task 2 (`unitToSatkerKey`), tabel `timeline` lokal (sudah ada), tabel `unit_riwayat` (Task 1), `TimelineEntry` (existing type di `src/types/index.ts:81-94`).
- Produces: untuk setiap entry timeline dengan `case_position` atau `previous_case_position` valid → upsert row ke `unit_riwayat` untuk satker_key terkait.

- [ ] **Step 1: Extend `getUnifiedTimeline` — baca baris cascade**

Di akhir `getUnifiedTimeline` (setelah upsert `timeline` ke Supabase), tambahkan `unit_riwayat` cascade. Lihat `src/lib/timeline-merge.ts:30-40` (lokasi upsert ke `timeline` saat ini).

Tepatnya, implementasi `deriveUnitRiwayat(entries: TimelineEntry[])` yang:

- Untuk setiap entry, tentukan `case_owner = entry.case_position` dan `prev_owner = entry.previous_case_position`.
- Bangun set `[case_owner, prev_owner]` non-null; untuk setiap value, panggil `unitToSatkerKey(value)` → `satker_key`.
- Untuk setiap kombinasi `(entry.prepetrator_id, pengaduan_id_terkait, satker_key)`: upsert row di `unit_riwayat` dengan field:
  - `current_owner = entry.case_position` (sumber kebenaran terbaru, ts `entry.date_activity` terbesar menang).
  - `last_event_type = entry.type`.
  - `last_event_nomor = entry.subject` atau extract dari `subject`.
  - `last_event_at = entry.date_activity`.
  - `last_status = entry.status_alias ?? entry.status`.
  - `att_count = entry.attachments?.length ?? 0`.
  - `status` = mapping sederhana: `entry.case_position === satker_key ? "aktif" : "dalam_penyidikan"`.

- `pengaduan_id_terkait` harus dari query `SELECT pengaduan.id FROM pengaduan WHERE prepetrator_id = entry.prepetrator_id LIMIT 1` (existing pattern di codebase sudah menggunakan join ini).

- [ ] **Step 2: Panggil derive** setelah upsert `timeline`

Modifikasi `getUnifiedTimeline`:

```typescript
// existing upsert ke timeline (baris ~37)
await supabase.from("timeline").upsert(rows, { onConflict: "id" })

// NEW: cascade ke unit_riwayat
await deriveUnitRiwayat(rowsToUpsert, supabase)
```

- [ ] **Step 3: Implementasi `deriveUnitRiwayat` di `src/lib/unit-riwayat-derive.ts` (NEW)**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js"
import type { TimelineEntry } from "@/types"
import { unitToSatkerKey } from "./unit-satker-key"

export async function deriveUnitRiwayat(
  entries: TimelineEntry[],
  supabase: SupabaseClient
): Promise<void> {
  if (entries.length === 0) return

  // Group by prepetrator_id → kumpulkan entries terbaru
  const byP = new Map<string, TimelineEntry[]>()
  for (const e of entries) {
    if (!e.prepetrator_id) continue
    if (!byP.has(e.prepetrator_id)) byP.set(e.prepetrator_id, [])
    byP.get(e.prepetrator_id)!.push(e)
  }

  for (const [prepetratorId, evts] of byP) {
    const { data: p } = await supabase
      .from("pengaduan")
      .select("id")
      .eq("prepetrator_id", prepetratorId)
      .limit(1)
      .single()
    if (!p) continue
    const pengaduanId = String(p.id)

    const sorted = [...evts].sort((a, b) =>
      (b.date_activity ?? "").localeCompare(a.date_activity ?? "")
    )
    const latest = sorted[0]
    const current_owner = latest.case_position ?? latest.status ?? ""

    const satkerKeysTouched = new Set<string>()
    for (const e of evts) {
      if (e.case_position) satkerKeysTouched.add(unitToSatkerKey(e.case_position))
      if (e.previous_case_position) satkerKeysTouched.add(unitToSatkerKey(e.previous_case_position))
    }

    const rows = Array.from(satkerKeysTouched).map((sk) => ({
      pengaduan_id: pengaduanId,
      prepetrator_id: prepetratorId,
      satker_key: sk,
      current_owner,
      last_event_type: latest.type ?? null,
      last_event_nomor: latest.subject ?? null,
      last_event_at: latest.date_activity ?? null,
      last_status: latest.status_alias ?? latest.status ?? null,
      status:
        current_owner && current_owner.toUpperCase().includes(sk) ? "aktif" : "dalam_penyidikan",
      att_count: latest.attachments?.length ?? 0,
      updated_at: new Date().toISOString(),
    }))

    if (rows.length > 0) {
      await supabase
        .from("unit_riwayat")
        .upsert(rows, { onConflict: "pengaduan_id,prepetrator_id,satker_key" })
    }
  }
}
```

- [ ] **Step 4: Verifikasi typecheck + lint**

```bash
npm run lint 2>/dev/null || (cat package.json | grep -E '"(lint|check)"')
npx tsc --noEmit src/lib/unit-riwayat-derive.ts src/lib/timeline-merge.ts
```

Expected: no errors. Lanjut Task 4.

---

### Task 4: API GET `/api/unit-riwayat`

**Files:**
- Create: `src/app/api/unit-riwayat/route.ts`

**Interfaces:**
- Produces: `GET /api/unit-riwayat?satker=<key>&locked=<true|false>` → `{ success: true, data: UnitRiwayat[] }`.
- Auth: pakai pola existing di codebase (lihat `src/app/api/unit/route.ts` untuk referensi — cek role/scope auth).

- [ ] **Step 1: Tulis route handler**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { unitToSatkerKey } from "@/lib/unit-satker-key"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const satkerParam = searchParams.get("satker") ?? ""
  const lockedParam = searchParams.get("locked")

  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 })
  }

  const satkerKey = unitToSatkerKey(satkerParam) || satkerParam
  if (!satkerKey) {
    return NextResponse.json({ success: false, error: "satker param wajib" }, { status: 400 })
  }

  let q = supabase
    .from("unit_riwayat")
    .select("*")
    .eq("satker_key", satkerKey)
    .order("updated_at", { ascending: false })

  if (lockedParam === "true") q = q.eq("is_locked", true)
  else if (lockedParam === "false") q = q.eq("is_locked", false)

  const { data, error } = await q
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: data ?? [] })
}
```

- [ ] **Step 2: Verifikasi typecheck**

```bash
npx tsc --noEmit src/app/api/unit-riwayat/route.ts
```

Expected: no errors. Lanjut Task 5.

---

### Task 5: Enforce `is_locked` di `aksi-paminal.tsx`

**Files:**
- Modify: `src/components/pengaduan/aksi-paminal.tsx`

**Interfaces:**
- Consumes: `is_locked` flag per `(pengaduan_id, prepetrator_id)`. Cara dapat: fetch di awal mount dari `/api/unit-riwayat?locked=true` + check `/api/unit-riwayat?locked=false`. Atau query server-side di parent page yang sudah dapat data pengaduan, lalu pass sebagai prop.
- Produces: tombol Simpan disable + banner read-only saat `is_locked`.

- [ ] **Step 1: Tambah prop `isLocked` di AksiCardRenderProps / parameter komponen**

Pola: lihat `AksiCardRenderProps` di `src/lib/aksi-cards/types.ts`. Tambah optional `isLocked?: boolean`.

- [ ] **Step 2: Di parent, hit `isLocked` lalu pass**

```typescript
const isLocked = pengaduan.case_position
  ? !pengaduan.case_position.toUpperCase().includes("PAMINAL")
  : false
```

(Catatan: `case_position` fieldnya sudah ada di tabel `pengaduan` dari sync. Kalau tidak ada, fallback ke `unit_progress` parsing — pola existing sudah di file.)

- [ ] **Step 3: Render banner read-only di atas tab bila `isLocked=true`**

```tsx
{isLocked && (
  <div className="text-[11px] text-amber-300 bg-amber-900/20 border border-amber-700 rounded px-2 py-1 mb-2">
    Kasus sudah diserah-terimakan ke <strong>{pengaduan.case_position ?? "unit lain"}</strong>.
    Dokumentasi tetap bisa dilihat, namun tombol Simpan dinonaktifkan.
  </div>
)}
```

- [ ] **Step 4: Disable tombol Simpan di seluruh blok `renderDocBlock` dan tombol "Update Status"**

Wrap pemanggilan tombol dengan:
```tsx
disabled={isLocked || *existingDisabled*}
```

Berlaku untuk: Simpan di blok Pelimpahan, Simpan di blok Sprin Henti Lidik/Annkum/SP2HP2/Mabes/STR, tombol "Update Progress" di Rekap tab, tombol "Update Status → PROSES LIDIK" di Tab Proses Lidik, tombol "LAPORAN SELESAI" di Tab Pelaporan.

- [ ] **Step 5: Verifikasi typecheck**

```bash
npx tsc --noEmit src/components/pengaduan/aksi-paminal.tsx
```

Expected: no errors.

---

### Task 6: Enforce `isLocked` di `aksi-kabid.tsx`

**Files:**
- Modify: `src/components/pengaduan/aksi-kabid.tsx`

**Interfaces:**
- Sama dengan Task 5; tombol yang dinonaktifkan: tombol Setujui disposisi, Tolak, dan/atau Kembalikan.

- [ ] **Step 1: Tambah `isLocked` prop, render banner, disable tombol**

Pola identik dengan Task 5.

Catatan: di Kabidpropam, `isLocked = (case_position !== KABIDPROPAM)`. Yaitu saat kasus sudah didisposisi ke unit tujuan. Setelah itu Kabidpropam read-only.

- [ ] **Step 2: Verifikasi typecheck**

```bash
npx tsc --noEmit src/components/pengaduan/aksi-kabid.tsx
```

Expected: no errors.

---

### Task 7: Enforce `isLocked` di `aksi-unit.tsx`

**Files:**
- Modify: `src/components/pengaduan/aksi-unit.tsx`

**Interfaces:**
- Sama: tombol Mulai Penyidikan / Progress / Selesai di-disable saat `isLocked`.

- [ ] **Step 1: Tambah `isLocked` prop, render banner, disable tombol**

`isLocked` di sini aktif bila `case_position !== unit_user_login`. Yaitu saat kasus sudah diserahkan lebih lanjut atau Paminal menariknya kembali. Hanya relevan setelah Kabidpropam disposisi diterima unit tujuan.

- [ ] **Step 2: Verifikasi typecheck**

```bash
npx tsc --noEmit src/components/pengaduan/aksi-unit.tsx
```

Expected: no errors.

---

### Task 8: UI per-unit dashboard — Paminal (tab Aktif / Sudah Dilimpahkan)

**Files:**
- Modify atau create: dashboard per-unit Paminal. Cari path di `src/app/(unit)/paminal/page.tsx` atau yang serupa (cek `find src/app -name "*paminal*"`).

**Interfaces:**
- Consumes: `GET /api/unit-riwayat?satker=PAMINAL&locked=<true|false>`, komponen tabel existing (`src/components/dashboard/pengaduan-table.tsx`).

- [ ] **Step 1: Identifikasi path dashboard Paminal**

```bash
find src/app -type d -iname "*paminal*"
```

- [ ] **Step 2: Tambah query hook untuk `unit_riwayat` per tab**

```typescript
const [tab, setTab] = useState<"aktif" | "dilimpahkan">("aktif")
const { data, isLoading } = useSWR(
  `/api/unit-riwayat?satker=PAMINAL&locked=${tab === "dilimpahkan"}`,
  fetcher
)
```

(Atau pakai `useEffect + fetch` bila tidak ada SWR — lihat pola existing di codebase.)

- [ ] **Step 3: Render tab bar + tabel**

```tsx
<div className="flex gap-0 border-b border-gray-700">
  <button
    onClick={() => setTab("aktif")}
    className={tab === "aktif" ? "..." : "..."}
  >
    Aktif ({countAktif})
  </button>
  <button
    onClick={() => setTab("dilimpahkan")}
    className={tab === "dilimpahkan" ? "..." : "..."}
  >
    Sudah Dilimpahkan ({countDilimpahkan})
  </button>
</div>
{isLoading ? <Loader /> : <PengaduanTable rows={data} showRiwayatOnly />}
```

- [ ] **Step 4: Tambah kolom "Status SOP" + "Dilimpahkan ke" di tabel existing bila `tab=dilimpahkan`**

Lihat `src/components/dashboard/pengaduan-table.tsx:30-48` untuk struktur interface. Tambah optional columns via prop atau extend interface.

- [ ] **Step 5: Verifikasi typecheck dan build**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

### Task 9: UI per-unit dashboard — Kabidpropam (tab Aktif / Sudah Didisposisi)

**Files:**
- Create if missing / modify: `src/app/(unit)/kabidpropam/page.tsx`

**Interfaces:**
- Sama dengan Task 8; ganti `satker=KABIDPROPAM`. Tab: **"Menunggu Disposisi"** (locked=false) + **"Sudah Didisposisi"** (locked=true).

- [ ] **Step 1: Tambah path jika belum ada** (cek: `find src/app -type d -iname "*kabid*" -o -iname "*kabidpropam*"`)

- [ ] **Step 2-5: Pola identik dengan Task 8, ganti satker key + label tab.**

---

### Task 10: Brain + Roadmap updates

**Files:**
- Modify: `brain/roadmap.md`

- [ ] **Step 1: Append timeline ke `sop-flow-limpahan` page via brain CLI**

```bash
node .opencode/skills/brain-page/bin/brain.mjs append-timeline \
  --id sop-flow-limpahan \
  --kind decision \
  --summary "Implementasi Tahapan A selesai: unit_riwayat + cascade + enforcement + per-unit dashboard Aktif/Locked" \
  --affects sop-flow-limpahan,tindak-lanjut-tab
```

- [ ] **Step 2: Update `brain/roadmap.md`**

Buka `brain/roadmap.md`, ubah tabel "Status Saat Ini" dengan baris:

```
| SOP Flow Limpahan (stage 1: foundation) | done |
| unit_riwayat materialized | done |
| cascade derive dari timeline Gajamada | done |
| is_locked enforcement di aksi components | done |
| Per-unit dashboard Aktif/Locked (Paminal + Kabidpropam) | done |
```

- [ ] **Step 3: `git status` & tampilkan ringkasan diff untuk user; TIDAK commit/push**

```bash
git status --short
git diff --stat
```

Tunggu konfirmasi user untuk commit (per AGENTS.md).

---

## Testing & verification

Karena codebase memiliki infrastruktur test minimal (`src/__tests__/login.test.tsx` saja), verifikasi dilakukan secara:

1. **Manual smoke test — flow end-to-end:**
   - Login sebagai Paminal → buka kasus → klik Simpan blok Pelimpahan → Switch role ke Kabidpropam → kasus muncul di tab "Menunggu Disposisi".
   - Login kembali sebagai Paminal (origin unit) → kasus terlihat di tab "Sudah Dilimpahkan", tombol Simpan disabled + banner.
   - Login sebagai Kabidpropam → klik Disposisi → Switch role ke unit tujuan → kasus muncul di sana; Kabidpropam read-only setelahnya.

2. **Brain + lint pass:**
   ```bash
   node .opencode/skills/brain-page/bin/brain.mjs lint-links
   npx tsc --noEmit
   ```

3. **Sync inbound smoke test:** Buka Dashboard → auto-sync (existing) → tunggu stale >1 jam atau panggil `POST /api/sync` manual → konfirmasi `unit_riwayat` ter-populate.

4. **Negative test:** Coba "Update Progress" di Paminal kasus yang sudah dilimpahkan → harusnya gagal (tombol disabled + tidak ada request terkirim).

## Out of scope (untuk fase berikutnya)

- Audit lintas-unit selector (filter rentang waktu lintas satker).
- Backfill otomatis `unit_riwayat` dari history timeline lama.
- Dashboard per `unit_tujuan` — di-handle di iterasi Tahapan A-extra.
- Delete `unit_riwayat` row saat `case_position` rollback (kasus ditarik Kembali oleh Paminal) — pantau apakah perlu diturunkan event "rollback" lalu derive ulang.

## Catatan penting

- **TIDAK ADA commit/push pada plan ini** — semua perubahan tetap di working copy sampai user eksplisit memerintahkan.
- Setiap task boleh dipecah lagi menjadi sub-step jika reviewer menolak satu task tapi menerima tetangganya.
