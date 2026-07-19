# Paminal Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restruktur Card Aksi Paminal — pecah monolit `aksi-paminal.tsx` (973 baris) ke modul per-tab, overhaul Tab Tindak Lanjut (Terbukti→limpahan, Tidak Terbukti→sprin henti+Ankum), Tab Rekap, persistence blok+terlapor (migration 021), dan sync Gajamada (field alignment).

**Architecture:** Refactor ke file per-tab di `src/components/pengaduan/paminal/`, host tetap di `aksi-paminal.tsx` sebagai orchestrator. API `/api/unit` tambah action `limpahkan`. Migration `021_paminal_persistence.sql` tambah tabel `pelanggar_paminal` + kolom `prepetrator_id` di `dokumen_perkara`.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase, TypeScript, Tailwind CSS

## Global Constraints

- `gajamada_name` TIDAK BOLEH diubah — `normalized_name` yang boleh disesuaikan
- Status pattern-based via `src/lib/status-category.ts::categorizeStatus()`
- 1 gateway call untuk final (tidak 2 tahap selesai→limpah)
- Sync langsung ke Supabase + Gajamada via gateway, bukan trigger sync manual
- Ikuti gaya: no komentar, caveman style, fragments, no decorative text
- `buildNomor(unitLabel)` selalu pakai `"Subbid Paminal"` (hardcoded di route.ts)
- Tidak commit kecuali diperintah

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/021_paminal_persistence.sql` | Create | Migration: pelanggar_paminal + dokumen_perkara.prep_id |
| `src/components/pengaduan/paminal/paminal-shared.ts` | Create | Shared types + constants (dari aksi-paminal.tsx) |
| `src/components/pengaduan/paminal/proses-lidik-tab.tsx` | Create | Tab Proses Lidik (eksis di monolit) |
| `src/components/pengaduan/paminal/pelaporan-tab.tsx` | Create | Tab Pelaporan (eksis di monolit) |
| `src/components/pengaduan/paminal/pelanggar-tab.tsx` | Create | Tab Pelanggar (eksis di monolit) |
| `src/components/pengaduan/paminal/tindak-lanjut-tab.tsx` | Create | Tab Tindak Lanjut overhaul |
| `src/components/pengaduan/paminal/rekap-tab.tsx` | Create | Tab Rekap overhaul |
| `src/components/pengaduan/paminal/doc-block.tsx` | Create | renderDocBlock extracted |
| `src/components/pengaduan/aksi-paminal.tsx` | Modify | Jadi orchestrator tipis |
| `src/app/api/unit/route.ts` | Modify | Tambah action `limpahkan` + update `pelaporan` |
| `src/lib/template-nomor.ts` | Modify | (sudah done: +surat, sprin_henti, str_jukrah) |
| `src/app/admin/template-nomor/page.tsx` | Modify | (sudah done: +3 label baru) |

---

### Task 1: Migration 021 — Persistence Tables

**Files:**
- Create: `supabase/migrations/021_paminal_persistence.sql`

**Interfaces:**
- Produces: tabel `pelanggar_paminal` (snapshot JSONB) + kolom `prepetrator_id` di `dokumen_perkara`

- [ ] **Step 1: Create migration file**

```sql
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
```

- [ ] **Step 2: Verify migration file exists at correct path**

Run: `Get-ChildItem "supabase/migrations/021_paminal_persistence.sql"`

---

### Task 2: Extract Shared Types + Constants

**Files:**
- Create: `src/components/pengaduan/paminal/paminal-shared.ts`

**Interfaces:**
- Produces: `PelanggarItem`, `CatalogOptions`, `DocBlock`, `TindakLanjutItem`, `STAGES`, `STAGE_DOC_TYPES`, `BASE_TABS`, `PANGKAT_LIST`, `TINDAK_LANJUT`, `SYARAT_MATERIIL`, `SYARAT_PEMBATAS`, `SYARAT_FORMIL`, validators, helpers

- [ ] **Step 1: Create shared module file**

```typescript
export interface PelanggarItem {
  key: string
  prepetrator_id: string
  prepetrator_type: string
  prepetrator_description: string
  nama: string
  pangkat: string
  nrp: string
  jabatan: string
  kesatuan: string
  functional: string
  tempat_lahir: string
  tanggal_lahir: string
  telpon: string
  pendidikan: string
  jenis_kelamin: string
  wujud: string
  kategori: string
  sub_kategori: string
  pasal_disiplin: string[]
  pasal_kke: string[]
}

export interface CatalogOptions {
  value: string
  label: string
  category?: string
  sub_category?: string
}

export type DocBlock = {
  tanggal: string
  nomor: string
  files: File[]
  uploadedFiles: { url: string; file_name: string }[]
  saving: boolean
  saved: boolean
}
export const emptyBlock = (): DocBlock => ({ tanggal: "", nomor: "", files: [], uploadedFiles: [], saving: false, saved: false })

export interface TindakLanjutItem {
  key: string
  label: string
  checked: boolean
  nomor: string
}

export type TindakLanjutTabProps = {
  hasil: string
  tlList: TindakLanjutItem[]
  pelanggarList: PelanggarItem[]
  pelimpahan: string
  unitOptions: { value: string; label: string }[]
  onToggleTl: (idx: number) => void
  onSetTlNomor: (idx: number, nomor: string) => void
  onSetPelimpahan: (v: string) => void
  copied: boolean
  onSalinRekap: () => Promise<void>
}

export type RekapTabProps = {
  stage: string
  hasil: string
  gelarTgl: string
  gelarNo: string
  tlList: TindakLanjutItem[]
  pelanggarList: PelanggarItem[]
  pelimpahan: string
  error: string | null
  success: string | null
  skipGajamada: boolean
  onToggleSkip: (v: boolean) => void
  onSubmit: () => Promise<void>
  loading: boolean
  pengaduan: any
}

export type DocBlockProps = {
  title: string
  docType: string
  block: DocBlock
  setter: React.Dispatch<React.SetStateAction<DocBlock>>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlock, setter: React.Dispatch<React.SetStateAction<DocBlock>>) => Promise<void>
}

export const BASE_TABS = [
  { key: "proses_lidik" as const, label: "Proses Lidik" },
  { key: "pelaporan" as const, label: "Pelaporan" },
  { key: "tindak_lanjut" as const, label: "Tindak Lanjut" },
  { key: "rekap" as const, label: "Rekap" },
]

export const STAGES = [
  { value: "perencanaan", label: "Perencanaan" },
  { value: "pengumpulan", label: "Pengumpulan BAKET" },
  { value: "pengolahan", label: "Pengolahan" },
  { value: "pelaporan", label: "Pelaporan" },
]

export const STAGE_DOC_TYPES: Record<string, { value: string; label: string }[]> = {
  perencanaan: [
    { value: "pemberitahuan_awal", label: "Pemberitahuan Awal" },
    { value: "uuk", label: "UUK" },
    { value: "sprinlidik", label: "Sprinlidik" },
  ],
  pengumpulan: [],
  pengolahan: [
    { value: "notulen_gelar", label: "Notulen Gelar" },
  ],
  pelaporan: [
    { value: "lhp", label: "LHP" },
    { value: "nota_dinas", label: "Nota Dinas" },
  ],
}

export const PANGKAT_LIST = [
  "KOMBES POL", "AKBP", "KOMPOL", "AKP", "IPTU", "IPDA",
  "AIPTU", "AIPDA", "BRIPKA", "BRIGADIR", "BRIPTU", "BRIPDA",
  "ABRIP", "ABRIPTU", "ABRIPDA", "BHARAKA", "BHARATU", "BHARADA",
  "PENATA TK I", "PENATA", "PENATA MUDA TK I", "PENATA MUDA",
  "PENGATUR TK I", "PENGATUR", "PENGATUR MUDA TK I", "PENGATUR MUDA",
  "JURU TK I", "JURU", "JURU MUDA TK I", "JURU MUDA",
]

export const TINDAK_LANJUT: TindakLanjutItem[] = [
  { key: "pem_pelapor", label: "Pemberitahuan ke Pelapor", checked: true, nomor: "" },
  { key: "pem_ankum", label: "Pemberitahuan ke Ankum", checked: false, nomor: "" },
]

export const SYARAT_MATERIIL = [
  { key: "tidak_keresahan", label: "Tidak menimbulkan keresahan dan penolakan dari masyarakat" },
  { key: "tidak_konflik", label: "Tidak berdampak konflik sosial" },
  { key: "pernyataan_tidak_keberatan", label: "Adanya pernyataan dari semua pihak untuk tidak keberatan" },
  { key: "prinsip_pembatas", label: "Memenuhi kriteria Prinsip pembatas" },
]

export const SYARAT_PEMBATAS = [
  { key: "kesalahan_ringan", label: "Tingkat kesalahan pelaku tidak berat (Mensrea)" },
  { key: "bukan_berulang", label: "Pelaku bukan anggota yang sering melakukan pelanggaran" },
]

export const SYARAT_FORMIL = [
  { key: "surat_permohonan", label: "Surat Permohonan Perdamaian dari kedua belah pihak" },
  { key: "surat_pernyataan", label: "Surat Pernyataan Perdamaian kedua belah pihak" },
  { key: "surat_pencabutan", label: "Surat Pencabutan Laporan oleh pelapor di atas meterai" },
  { key: "ba_pemeriksaan", label: "Berita acara pemeriksaan tambahan terhadap kedua belah pihak" },
]

export function validateTelpon(telpon: string): { valid: boolean; warning: string } {
  if (!telpon) return { valid: true, warning: "" }
  const clean = telpon.replace(/\D/g, "")
  if (clean.length < 10) return { valid: false, warning: "No. HP minimal 10 digit" }
  if (!clean.startsWith("0") && !clean.startsWith("62")) return { valid: false, warning: "No. HP harus diawali 0 atau 62" }
  return { valid: true, warning: "" }
}

export function validateNrp(nrp: string, tglLahir: string): { valid: boolean; warning: string } {
  if (!nrp) return { valid: true, warning: "" }
  const clean = nrp.replace(/\D/g, "")
  if (clean.length === 8) {
    const yy = parseInt(clean.slice(0, 2))
    const mm = parseInt(clean.slice(2, 4))
    if (mm < 1 || mm > 12) return { valid: false, warning: `NRP tidak valid: bulan ${mm} tidak ada (harus 01-12)` }
    if (tglLahir) {
      const d = new Date(tglLahir)
      if (!isNaN(d.getTime())) {
        const expectedYY = String(d.getFullYear()).slice(2)
        const expectedMM = String(d.getMonth() + 1).padStart(2, "0")
        if (clean.slice(0, 4) !== expectedYY + expectedMM) {
          const birthYear = d.getFullYear()
          const now = new Date().getFullYear()
          const age = now - birthYear
          if (age > 58) return { valid: false, warning: `Peringatan: usia ${age} tahun — sudah melewati batas pensiun (58 tahun)` }
          if (age < 18) return { valid: false, warning: `Peringatan: usia ${age} tahun — terlalu muda` }
          return { valid: false, warning: `NRP (${clean}) tidak sesuai tanggal lahir — seharusnya ${expectedYY}${expectedMM}XXXX` }
        }
      }
    }
    return { valid: true, warning: "" }
  }
  if (clean.length >= 16) {
    const y = parseInt(clean.slice(0, 4))
    const m = parseInt(clean.slice(4, 6))
    const d = parseInt(clean.slice(6, 8))
    if (m < 1 || m > 12) return { valid: false, warning: `NIP tidak valid: bulan ${m} tidak ada (harus 01-12)` }
    if (d < 1 || d > 31) return { valid: false, warning: `NIP tidak valid: tanggal ${d} tidak ada (harus 01-31)` }
    if (tglLahir && clean.length === 18) {
      const bd = new Date(tglLahir)
      if (!isNaN(bd.getTime())) {
        const ey = bd.getFullYear().toString()
        const em = String(bd.getMonth() + 1).padStart(2, "0")
        const ed = String(bd.getDate()).padStart(2, "0")
        if (clean.slice(0, 8) !== ey + em + ed) {
          return { valid: false, warning: `NIP tidak sesuai tanggal lahir — seharusnya ${ey}${em}${ed}XXXXXXXXXX` }
        }
      }
    }
    return { valid: true, warning: "" }
  }
  if (clean.length > 0) {
    return { valid: false, warning: `NRP/NIP harus 8 digit (Polri) atau 16/18 digit (PNS)` }
  }
  return { valid: true, warning: "" }
}

export const PELIMPAHAN_TARGETS: { value: string; label: string; statusLabel: string }[] = [
  { value: "UNIT PROVOS POLDA JAWA BARAT", label: "Provos", statusLabel: "LIMPAH KE UNIT PROVOS" },
  { value: "SUBBID WABPROF POLDA JAWA BARAT", label: "Wabprof", statusLabel: "LIMPAH SUBBIDAWBPROF" },
]
```

- [ ] **Step 2: Verify file**

Run: `Get-ChildItem "src/components/pengaduan/paminal/paminal-shared.ts"`

---

### Task 3: Extract DocBlock Component

**Files:**
- Create: `src/components/pengaduan/paminal/doc-block.tsx`

**Interfaces:**
- Consumes: `DocBlock`, `DocBlockProps` from `paminal-shared.ts`
- Produces: `<DocBlock>` component

- [ ] **Step 1: Create doc-block.tsx**

```tsx
"use client"

import { Loader2, Save, Check, RotateCcw, Paperclip } from "lucide-react"
import { DateInput } from "@/components/ui/date-input"
import { buildNomor } from "@/lib/template-nomor"
import type { DocBlock } from "./paminal-shared"

export type DocBlockProps = {
  title: string
  docType: string
  block: DocBlock
  setter: React.Dispatch<React.SetStateAction<DocBlock>>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlock, setter: React.Dispatch<React.SetStateAction<DocBlock>>) => Promise<void>
}

const autoFillDocTypes = ["pemberitahuan_awal", "uuk", "sprinlidik", "notulen_gelar", "lhp", "nota_dinas"]

export function DocBlock({ title, docType, block, setter, customTemplates, onSimpanDok }: DocBlockProps) {
  function handleTanggal(val: string) {
    setter(prev => {
      let nextNomor = prev.nomor
      if (val && autoFillDocTypes.includes(docType)) {
        const d = new Date(val + "T00:00:00")
        const generated = buildNomor(docType, "     ", d.getMonth() + 1, d.getFullYear(), "Subbid Paminal", customTemplates)
        if (!prev.nomor) {
          nextNomor = generated
        } else {
          const tpl = (customTemplates && customTemplates[docType]) ? customTemplates[docType] : "{no}/{rom}/{thn}/{unit}"
          const parts = tpl.split("{no}")
          if (parts.length === 2 && prev.nomor.startsWith(parts[0])) {
            const afterPrefix = prev.nomor.substring(parts[0].length)
            const possibleNo = afterPrefix.split("/")[0]
            nextNomor = buildNomor(docType, possibleNo, d.getMonth() + 1, d.getFullYear(), "Subbid Paminal", customTemplates)
          } else {
            nextNomor = generated
          }
        }
      }
      return { ...prev, tanggal: val, nomor: nextNomor }
    })
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-300">{title}</p>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Tanggal</p>
          <DateInput value={block.tanggal} onChange={handleTanggal}
            className="text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
        </div>
        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Nomor Lengkap</p>
          <input type="text" value={block.nomor}
            onChange={e => setter(p => ({ ...p, nomor: e.target.value }))}
            placeholder="Isi nomor lengkap..."
            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
        </div>
      </div>
      <div className="flex gap-1.5 items-center">
        <button onClick={() => onSimpanDok(docType, block, setter)} disabled={block.saving || !block.tanggal || !block.nomor}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-40">
          {block.saving ? <Loader2 className="w-3 h-3 animate-spin" /> : block.saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {block.saved ? "Tersimpan" : "Simpan"}
        </button>
        <button onClick={() => setter(p => ({ ...p, tanggal: "", nomor: "", saving: false, saved: false }))} className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <label className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded cursor-pointer">
          <Paperclip className="w-3 h-3" /> Upload
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={e => {
            if (e.target.files) {
              const arr = Array.from(e.target.files)
              setter(p => ({ ...p, files: [...p.files, ...arr] }))
            }
          }} />
        </label>
      </div>
      {(block.files.length > 0 || block.uploadedFiles.length > 0) && (
        <div className="bg-[#1E293B] rounded p-1.5 mt-1 border border-gray-600">
          <p className="text-[11px] text-gray-400 mb-1">File Terlampir:</p>
          <ul className="space-y-0.5">
            {block.uploadedFiles.map((f, i) => (
              <li key={`up-${i}`} className="flex items-center justify-between text-xs text-gray-200">
                <span className="truncate text-green-400">{f.file_name}</span>
              </li>
            ))}
            {block.files.map((f, i) => (
              <li key={`new-${i}`} className="flex items-center justify-between text-xs text-gray-200">
                <span className="truncate text-yellow-400">{f.name} (belum disimpan)</span>
                <button onClick={() => setter(p => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-300 ml-2 shrink-0">Hapus</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `Get-ChildItem "src/components/pengaduan/paminal/doc-block.tsx"`

---

### Task 4: Extract Proses Lidik Tab

**Files:**
- Create: `src/components/pengaduan/paminal/proses-lidik-tab.tsx`

**Interfaces:**
- Consumes: `DocBlock`, `DocBlockProps` from shared
- Produces: `<ProsesLidikTab skilGajamada onToggleSkip updatingStatus pemberitahuanAwal uuk sprin onUpdateStatusLidik customTemplates onSimpanDok />`

- [ ] **Step 1: Create proses-lidik-tab.tsx**

```tsx
"use client"

import { Loader2, Play } from "lucide-react"
import { DocBlock, type DocBlockProps } from "./doc-block"
import type { DocBlock as DocBlockType } from "./paminal-shared"

interface Props {
  skipGajamada: boolean
  onToggleSkip: (v: boolean) => void
  updatingStatus: boolean
  pemberitahuanAwal: DocBlockType
  setPemberitahuanAwal: React.Dispatch<React.SetStateAction<DocBlockType>>
  uuk: DocBlockType
  setUuk: React.Dispatch<React.SetStateAction<DocBlockType>>
  sprin: DocBlockType
  setSprin: React.Dispatch<React.SetStateAction<DocBlockType>>
  onUpdateStatusLidik: () => Promise<void>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlockType, setter: React.Dispatch<React.SetStateAction<DocBlockType>>) => Promise<void>
}

export default function ProsesLidikTab({
  skipGajamada, onToggleSkip, updatingStatus,
  pemberitahuanAwal, setPemberitahuanAwal,
  uuk, setUuk, sprin, setSprin,
  onUpdateStatusLidik, customTemplates, onSimpanDok,
}: Props) {
  return (
    <div className="space-y-3">
      <DocBlock title="Pemberitahuan Awal" docType="pemberitahuan_awal" block={pemberitahuanAwal} setter={setPemberitahuanAwal} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="UUK" docType="uuk" block={uuk} setter={setUuk} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="Sprin Lidik" docType="sprinlidik" block={sprin} setter={setSprin} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer mb-1.5">
        <input type="checkbox" checked={skipGajamada} onChange={e => onToggleSkip(e.target.checked)}
          className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
        Jangan update timeline Gajamada
      </label>
      <button onClick={onUpdateStatusLidik} disabled={updatingStatus}
        className="w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded disabled:opacity-40">
        {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
        Update Status → PROSES LIDIK
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `Get-ChildItem "src/components/pengaduan/paminal/proses-lidik-tab.tsx"`

---

### Task 5: Extract Pelaporan Tab

**Files:**
- Create: `src/components/pengaduan/paminal/pelaporan-tab.tsx`

**Interfaces:**
- Consumes: `DocBlock` from shared
- Produces: `<PelaporanTab hasil onSetHasil onSetPelimpahan gelarBlock setGelarBlock lhp setLhp nodin setNodin skipGajamada onToggleSkip loading onStageUpdate customTemplates onSimpanDok pelanggarList setError setLoading />`

- [ ] **Step 1: Create pelaporan-tab.tsx**

```tsx
"use client"

import { Loader2, Send } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocBlock } from "./doc-block"
import type { DocBlock as DocBlockType, PelanggarItem } from "./paminal-shared"
import { validateNrp } from "./paminal-shared"

interface Props {
  hasil: string
  onSetHasil: (v: string) => void
  onSetPelimpahan: (v: string) => void
  gelarBlock: DocBlockType
  setGelarBlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  lhp: DocBlockType
  setLhp: React.Dispatch<React.SetStateAction<DocBlockType>>
  nodin: DocBlockType
  setNodin: React.Dispatch<React.SetStateAction<DocBlockType>>
  skipGajamada: boolean
  onToggleSkip: (v: boolean) => void
  loading: boolean
  pelanggarList: PelanggarItem[]
  onStageUpdate: (hasil: string) => Promise<boolean>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlockType, setter: React.Dispatch<React.SetStateAction<DocBlockType>>) => Promise<void>
}

export default function PelaporanTab({
  hasil, onSetHasil, onSetPelimpahan,
  gelarBlock, setGelarBlock,
  lhp, setLhp, nodin, setNodin,
  skipGajamada, onToggleSkip, loading,
  pelanggarList, onStageUpdate,
  customTemplates, onSimpanDok,
}: Props) {
  async function handleClick() {
    if (hasil === "terbukti") {
      const invalid: string[] = []
      pelanggarList.forEach((p, i) => {
        const required: { field: string; val: string }[] = [
          { field: "Nama", val: p.nama }, { field: "Pangkat", val: p.pangkat }, { field: "NRP", val: p.nrp }, { field: "Wujud Perbuatan", val: p.wujud },
        ]
        if (pelanggarList.length === 1) {
          const anyFilled = required.some(r => r.val.trim())
          if (!anyFilled) return
        }
        required.forEach(r => { if (!r.val.trim()) invalid.push(`Pelanggar ${i+1}: ${r.field} wajib diisi`) })
        if (p.nrp) {
          const v = validateNrp(p.nrp, p.tanggal_lahir)
          if (v.warning && !v.valid) invalid.push(`Pelanggar ${i+1}: ${v.warning}`)
        }
        if (!p.pasal_disiplin.length && !p.pasal_kke.length) invalid.push(`Pelanggar ${i+1}: minimal satu pasal wajib dipilih`)
      })
      if (invalid.length > 0) return
    }
    await onStageUpdate(hasil)
  }

  return (
    <div className="space-y-3">
      <DocBlock title="Gelar Perkara" docType="notulen_gelar" block={gelarBlock} setter={setGelarBlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="LHP" docType="lhp" block={lhp} setter={setLhp} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="Nota Dinas" docType="nota_dinas" block={nodin} setter={setNodin} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-green-400 mb-1">Hasil Lidik</p>
        <Select value={hasil} onValueChange={(v) => { onSetHasil(v ?? ""); if (v !== "terbukti") onSetPelimpahan("") }}>
          <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
            <SelectValue placeholder="Pilih hasil..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
            <SelectItem value="terbukti">Terbukti</SelectItem>
            <SelectItem value="perdamaian">Perdamaian</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <hr className="border-gray-700" />
      <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer mb-1.5">
        <input type="checkbox" checked={skipGajamada} onChange={e => onToggleSkip(e.target.checked)}
          className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
        Jangan update timeline Gajamada
      </label>
      <button onClick={handleClick} disabled={loading || !hasil}
        className="w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded disabled:opacity-40">
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        Update Status → {hasil === "terbukti" ? "LAPORAN SELESAI" : hasil === "perdamaian" ? "RESTORATIVE JUSTICE" : hasil === "tidak_terbukti" ? "TIDAK TERBUKTI" : "Pilih Hasil"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `Get-ChildItem "src/components/pengaduan/paminal/pelaporan-tab.tsx"`

---

### Task 6: Extract Pelanggar Tab (unchanged UX)

**Files:**
- Create: `src/components/pengaduan/paminal/pelanggar-tab.tsx`

**Interfaces:**
- Consumes: `PelanggarItem`, `CatalogOptions`, validators from shared
- Produces: `<PelanggarTab pelanggarList setPelanggarList catalogPasal catalogWujud loading error success onSavePelanggar onReset skipGajamada />`

**Note:** This tab UX does NOT change in this phase. Only extraction.

- [ ] **Step 1: Create pelanggar-tab.tsx** — extract the full Pelanggar editor from aksi-paminal.tsx lines 645-873, exactly as-is with only import path changes.

This step is too large to inline. The content is the existing JSX block from the monolit. Extract verbatim with imports updated to `../paminal-shared`.

- [ ] **Step 2: Verify file exists and compiles**

---

### Task 7: Overhaul Tab Tindak Lanjut

**Files:**
- Create: `src/components/pengaduan/paminal/tindak-lanjut-tab.tsx`

**Interfaces:**
- Consumes: `TindakLanjutTabProps` from shared
- Produces: `<TindakLanjutTab hasil tlList pelanggarList pelimpahan unitOptions onToggleTl onSetTlNomor onSetPelimpahan copied onSalinRekap />`

- [ ] **Step 1: Create tindak-lanjut-tab.tsx** with SOP-based flow:

- Jika hasil=`terbukti` → tampilkan combobox pelimpahan + status target
- Jika hasil=`tidak_terbukti` → wajibkan sprin_henti + pem_ankum
- Kondisi read-only setelah selesai: semua input disabled, tampilkan badge "Dilimpahkan → {tujuan}"

```tsx
"use client"

import { Copy, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PELIMPAHAN_TARGETS, type TindakLanjutTabProps } from "./paminal-shared"
import { DocBlock } from "./doc-block"
import type { DocBlock as DocBlockType } from "./paminal-shared"

interface Props extends TindakLanjutTabProps {
  isDone: boolean
  targetStatus: string
  onSetTargetStatus: (v: string) => void
  sprinHenti: DocBlockType
  setSprinHenti: React.Dispatch<React.SetStateAction<DocBlockType>>
  pemAnkum: DocBlockType
  setPemAnkum: React.Dispatch<React.SetStateAction<DocBlockType>>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlockType, setter: React.Dispatch<React.SetStateAction<DocBlockType>>) => Promise<void>
}

export default function TindakLanjutTab({
  hasil, tlList, pelanggarList, pelimpahan, unitOptions,
  onToggleTl, onSetTlNomor, onSetPelimpahan,
  copied, onSalinRekap,
  isDone, targetStatus, onSetTargetStatus,
  sprinHenti, setSprinHenti,
  pemAnkum, setPemAnkum,
  customTemplates, onSimpanDok,
}: Props) {
  const isTerbukti = hasil === "terbukti"
  const isTidakTerbukti = hasil === "tidak_terbukti"

  if (isDone) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-green-400 text-center">Proses sudah selesai</p>
        {pelimpahan && (
          <p className="text-xs text-gray-400 text-center">Dilimpahkan → {pelimpahan}</p>
        )}
        {tlList.filter(t => t.checked).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400">Tindak Lanjut:</p>
            {tlList.filter(t => t.checked).map(t => (
              <p key={t.key} className="text-xs text-gray-300">{t.label} — No: {t.nomor || "-"}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {isTerbukti && (
        <>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-yellow-400 mb-1">Pelimpahan (terbukti)</p>
            <Select value={pelimpahan} onValueChange={onSetPelimpahan}>
              <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                <SelectValue placeholder="Pilih target pelimpahan..." />
              </SelectTrigger>
              <SelectContent>
                {PELIMPAHAN_TARGETS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label} — {t.statusLabel}</SelectItem>
                ))}
                <SelectItem value="custom">Lainnya (input manual)</SelectItem>
              </SelectContent>
            </Select>
            {pelimpahan === "custom" && (
              <input type="text" value={pelimpahan === "custom" ? "" : pelimpahan}
                onChange={e => onSetPelimpahan(e.target.value)}
                placeholder="Nama unit tujuan..."
                className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600 mt-1" />
            )}
            {pelimpahan && pelimpahan !== "custom" && (
              <p className="text-[11px] text-blue-400">
                Status: {PELIMPAHAN_TARGETS.find(t => t.value === pelimpahan)?.statusLabel ?? "Laporan Dikirim ke Satker"}
              </p>
            )}
          </div>
          <hr className="border-gray-700" />
        </>
      )}

      {isTidakTerbukti && (
        <>
          <p className="text-xs font-semibold text-red-400 mb-1">Tidak Terbukti — wajib upload:</p>
          <DocBlock title="Sprin Henti Lidik" docType="sprin_henti" block={sprinHenti} setter={setSprinHenti} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
          <hr className="border-gray-700" />
          <DocBlock title="Pemberitahuan ke Ankum" docType="pem_ankum" block={pemAnkum} setter={setPemAnkum} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
          <hr className="border-gray-700" />
        </>
      )}

      <p className="text-xs font-semibold text-gray-400 mb-1">Tindak Lanjut Wajib</p>
      {tlList.map((tl, idx) => (
        <div key={tl.key} className="flex items-center gap-2 mb-1">
          <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={tl.checked}
              onChange={() => onToggleTl(idx)}
              className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]"
            />
            {tl.label}
          </label>
          {tl.checked && (
            <input
              type="text"
              value={tl.nomor}
              onChange={(e) => onSetTlNomor(idx, e.target.value)}
              placeholder="No"
              className="w-24 text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7"
            />
          )}
        </div>
      ))}

      {pelanggarList.length > 0 && (
        <div className="bg-[#1E293B] border border-gray-600 rounded p-2 space-y-1">
          <p className="text-xs font-semibold text-yellow-400">Data Terlapor</p>
          {pelanggarList.map((p, i) => (
            <div key={i} className="text-[11px] text-gray-300">
              <p>{p.nama} — {p.pangkat} — NRP: {p.nrp}</p>
              <p className="text-gray-500">{p.jabatan} | {p.kesatuan}</p>
              {p.pasal_disiplin.length > 0 && <p className="text-blue-300">Disiplin: {p.pasal_disiplin.join(", ")}</p>}
              {p.pasal_kke.length > 0 && <p className="text-purple-300">KKE: {p.pasal_kke.join(", ")}</p>}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onSalinRekap}
        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Tersalin!" : "Salin Rekap"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `Get-ChildItem "src/components/pengaduan/paminal/tindak-lanjut-tab.tsx"`

---

### Task 8: Overhaul Tab Rekap

**Files:**
- Create: `src/components/pengaduan/paminal/rekap-tab.tsx`

**Interfaces:**
- Consumes: `RekapTabProps` from shared
- Produces: `<RekapTab stage hasil gelarBlock tlList pelanggarList pelimpahan error success skipGajamada onToggleSkip onSubmit loading pengaduan isDone />`

- [ ] **Step 1: Create rekap-tab.tsx**

```tsx
"use client"

import { Loader2, Send } from "lucide-react"
import { STAGES } from "./paminal-shared"
import type { RekapTabProps } from "./paminal-shared"

interface Props extends RekapTabProps {
  isDone: boolean
  gelarTgl: string
  gelarNo: string
  pelimpahan: string
}

export default function RekapTab({
  stage, hasil, gelarTgl, gelarNo, tlList, pelanggarList, pelimpahan,
  error, success, skipGajamada, onToggleSkip, onSubmit, loading, pengaduan, isDone,
}: Props) {
  if (isDone) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400">Ringkasan Final</p>
        <div className="text-xs text-gray-300 space-y-1">
          <p><span className="text-gray-500">Tahap:</span> {STAGES.find(s => s.value === stage)?.label}</p>
          {gelarTgl && <p><span className="text-gray-500">Gelar:</span> {gelarTgl}</p>}
          {gelarNo && <p><span className="text-gray-500">Notulen:</span> {gelarNo}</p>}
          {hasil && <p><span className="text-gray-500">Hasil:</span> {hasil === "terbukti" ? "Terbukti" : hasil === "perdamaian" ? "Perdamaian" : "Tidak Terbukti"}</p>}
          {pelimpahan && <p><span className="text-gray-500">Pelimpahan:</span> {pelimpahan}</p>}
          {tlList.filter(t => t.checked).length > 0 && (
            <p><span className="text-gray-500">Tindak Lanjut:</span>{" "}{tlList.filter(t => t.checked).map(t => t.label).join(", ")}</p>
          )}
          {pelanggarList.filter(p => p.nama.trim()).length > 0 && (
            <div>
              <p className="text-gray-500">Pelanggar:</p>
              {pelanggarList.filter(p => p.nama.trim()).map((p, i) => (
                <p key={i} className="ml-2">- {p.nama} / {p.pangkat} / NRP: {p.nrp}</p>
              ))}
            </div>
          )}
        </div>
        {pengaduan.unit_progress && (
          <p className="text-xs text-gray-400">{pengaduan.unit_progress}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 mb-1">Ringkasan</p>
      <div className="text-xs text-gray-300 space-y-1">
        <p><span className="text-gray-500">Tahap:</span> {STAGES.find(s => s.value === stage)?.label}</p>
        {gelarTgl && <p><span className="text-gray-500">Gelar:</span> {gelarTgl}</p>}
        {gelarNo && <p><span className="text-gray-500">Notulen:</span> {gelarNo}</p>}
        {hasil && <p><span className="text-gray-500">Hasil:</span> {hasil === "terbukti" ? "Terbukti" : hasil === "perdamaian" ? "Perdamaian" : "Tidak Terbukti"}</p>}
        {pelimpahan && <p><span className="text-gray-500">Pelimpahan:</span> {pelimpahan}</p>}
        {tlList.filter(t => t.checked).length > 0 && (
          <p><span className="text-gray-500">Tindak Lanjut:</span>{" "}{tlList.filter(t => t.checked).map(t => t.label).join(", ")}</p>
        )}
        {pelanggarList.filter(p => p.nama.trim()).length > 0 && (
          <p><span className="text-gray-500">Pelanggar:</span>{" "}{pelanggarList.filter(p => p.nama.trim()).map(p => p.nama).join(", ")}</p>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">{success}</p>}

      <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer mb-1.5">
        <input type="checkbox" checked={skipGajamada} onChange={e => onToggleSkip(e.target.checked)}
          className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
        Jangan update timeline Gajamada
      </label>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <Send className="w-3 h-3 mr-1 inline" />}
        {stage === "pelaporan" ? "Selesai & Kirim" : "Update Progress"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `Get-ChildItem "src/components/pengaduan/paminal/rekap-tab.tsx"`

---

### Task 9: Refactor aksi-paminal.tsx (orchestrator)

**Files:**
- Modify: `src/components/pengaduan/aksi-paminal.tsx`

**Interfaces:**
- Consumes: All `paminal/*` tab modules, shared types/helpers
- Produces: Thin orchestrator with state management + tab routing

- [ ] **Step 1: Rewrite aksi-paminal.tsx** — replace the entire file with the orchestrator version:

```tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send, Copy, Check, RotateCcw, Plus, Trash2 } from "lucide-react"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"
import ProsesLidikTab from "./paminal/proses-lidik-tab"
import PelaporanTab from "./paminal/pelaporan-tab"
import PelanggarTab from "./paminal/pelanggar-tab"
import TindakLanjutTab from "./paminal/tindak-lanjut-tab"
import RekapTab from "./paminal/rekap-tab"
import {
  PelanggarItem, CatalogOptions, DocBlock, TindakLanjutItem,
  emptyBlock, BASE_TABS, STAGES, STAGE_DOC_TYPES, PANGKAT_LIST,
  TINDAK_LANJUT, SYARAT_MATERIIL, SYARAT_PEMBATAS, SYARAT_FORMIL,
  validateTelpon, validateNrp, PELIMPAHAN_TARGETS,
} from "./paminal/paminal-shared"

export default function AksiPaminal({ pengaduanId, prepetratorId, pengaduan, config }: AksiCardRenderProps) {
  const unitStatus = pengaduan.unit_status
  const currentPosition = pengaduan.case_position
  const isDone = unitStatus === "pelaporan_selesai" || unitStatus === "selesai"
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [skipGajamada, setSkipGajamada] = useState(false)
  const [activeTab, setActiveTab] = useState(isDone ? "rekap" : "proses_lidik")
  const [hasil, setHasil] = useState("")
  const [pelimpahan, setPelimpahan] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  // Catalog data
  const [catalogPasal, setCatalogPasal] = useState<CatalogOptions[]>([])
  const [catalogWujud, setCatalogWujud] = useState<CatalogOptions[]>([])
  const [catalogUnit, setCatalogUnit] = useState<{ value: string; label: string }[]>([])

  // Doc blocks
  const [pemberitahuanAwal, setPemberitahuanAwal] = useState<DocBlock>(emptyBlock())
  const [uuk, setUuk] = useState<DocBlock>(emptyBlock())
  const [sprin, setSprin] = useState<DocBlock>(emptyBlock())
  const [gelarBlock, setGelarBlock] = useState<DocBlock>(emptyBlock())
  const [lhp, setLhp] = useState<DocBlock>(emptyBlock())
  const [nodin, setNodin] = useState<DocBlock>(emptyBlock())
  const [sprinHenti, setSprinHenti] = useState<DocBlock>(emptyBlock())
  const [pemAnkum, setPemAnkum] = useState<DocBlock>(emptyBlock())

  // Pelanggar
  const [pelanggarList, setPelanggarList] = useState<PelanggarItem[]>([])

  // Tindak lanjut
  const [tlList, setTlList] = useState<TindakLanjutItem[]>(TINDAK_LANJUT.map(t => ({ ...t })))

  // Perdamaian
  const [perdamaianMateriil, setPerdamaianMateriil] = useState<Record<string, boolean>>({})
  const [perdamaianPembatas, setPerdamaianPembatas] = useState<Record<string, boolean>>({})
  const [perdamaianFormil, setPerdamaianFormil] = useState<Record<string, boolean>>({})

  const stage = activeTab === "pelaporan" || activeTab === "terbukti" ? "pelaporan"
    : activeTab === "tindak_lanjut" || activeTab === "rekap" ? "pelaporan"
    : "perencanaan"

  const TABS = hasil === "terbukti"
    ? [...BASE_TABS.slice(0, 2), { key: "terbukti" as const, label: "Pelanggar" }, ...BASE_TABS.slice(2)]
    : BASE_TABS

  useEffect(() => {
    fetch("/api/catalog").then(r => r.json()).then(j => {
      setCatalogPasal(j.data?.pasal ?? [])
      setCatalogWujud(j.data?.wujud ?? [])
      setCatalogUnit(j.data?.unit ?? [])
    }).catch(() => {})
    fetch("/api/admin/settings").then(r => r.json()).then(j => {
      const row = (j.data ?? []).find((r: any) => r.key === "doc_templates")
      if (row?.value) try { setCustomTemplates(row.value as Record<string, string>) } catch {}
    }).catch(() => {})
  }, [])

  function toggleTl(idx: number) {
    const next = [...tlList]
    next[idx].checked = !next[idx].checked
    setTlList(next)
  }

  function setTlNomor(idx: number, nomor: string) {
    const next = [...tlList]
    next[idx].nomor = nomor
    setTlList(next)
  }

  async function salinRekap() {
    const lines = tlList.filter(tl => tl.checked).map(tl => `${tl.label} — No: ${tl.nomor || "-"}`)
    const text = `Tindak Lanjut Wajib:\n${lines.join("\n")}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function simpanDok(docType: string, block: DocBlock, setter: React.Dispatch<React.SetStateAction<DocBlock>>) {
    if (!block.tanggal || !block.nomor) return
    setter(p => ({ ...p, saving: true }))
    try {
      const payload = {
        action: "upload_only",
        pengaduanId, prepetratorId,
        dokumen: [{ doc_type: docType, nomor: block.nomor, tanggal: block.tanggal }],
      }
      let res
      if (block.files.length > 0) {
        const fd = new FormData()
        fd.append("data", JSON.stringify(payload))
        block.files.forEach(f => fd.append("files", f))
        res = await fetch("/api/unit", { method: "POST", body: fd })
      } else {
        res = await fetch("/api/unit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      const uploaded = (json.attachments ?? []) as { url: string; file_name: string }[]
      setter(p => ({ ...p, saving: false, saved: true, files: [], uploadedFiles: [...p.uploadedFiles, ...uploaded] }))
      window.dispatchEvent(new CustomEvent("e-propam:file-uploaded"))
      setTimeout(() => setter(p => ({ ...p, saved: false })), 2000)
      router.refresh()
    } catch { setter(p => ({ ...p, saving: false })) }
  }

  async function handleUpdateStatusLidik() {
    setUpdatingStatus(true)
    try {
      await fetch("/api/unit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mulai", pengaduanId, prepetratorId, currentPosition: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT", skip_gajamada: skipGajamada }),
      })
      router.refresh()
    } catch {} finally { setUpdatingStatus(false) }
  }

  async function handleSavePelanggar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_pelanggar", pengaduanId, prepetratorId, skip_gajamada: skipGajamada, pelanggar_list: pelanggarList }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      router.refresh()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  async function handleStageUpdate(hasilVal: string) {
    const targetStatus = PELIMPAHAN_TARGETS.find(t => t.value === pelimpahan)?.statusLabel ?? "Laporan Dikirim ke Satker"
    const isTerbukti = hasilVal === "terbukti"
    const finalStatus = isTerbukti ? targetStatus
      : hasilVal === "perdamaian" ? "RESTORATIVE JUSTICE"
      : hasilVal === "tidak_terbukti" ? "TIDAK TERBUKTI"
      : "Proses Lidik"
    const finalCasePos = isTerbukti ? pelimpahan : currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT"

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isTerbukti ? "limpahkan" : "pelaporan",
          pengaduanId, prepetratorId,
          currentPosition,
          stage: "pelaporan",
          hasil: hasilVal,
          terbukti: isTerbukti,
          gelar_tanggal: gelarBlock.tanggal,
          gelar_notulen: gelarBlock.nomor,
          pelimpahan: isTerbukti ? pelimpahan : undefined,
          target_status: finalStatus,
          target_case_position: finalCasePos,
          pelanggar_list: isTerbukti ? pelanggarList : undefined,
          perdamaian_materiil: hasilVal === "perdamaian" ? perdamaianMateriil : undefined,
          perdamaian_pembatas: hasilVal === "perdamaian" ? perdamaianPembatas : undefined,
          perdamaian_formil: hasilVal === "perdamaian" ? perdamaianFormil : undefined,
          tindak_lanjut: tlList,
          skip_gajamada: skipGajamada,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      router.refresh()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  const title = (config?.title as string) ?? "Proses Paminal"

  if (isDone) return (
    <AksiCard title={title} variant="default">
      <RekapTab
        stage={stage} hasil={hasil} gelarTgl={gelarBlock.tanggal} gelarNo={gelarBlock.nomor}
        tlList={tlList} pelanggarList={pelanggarList} pelimpahan={pelimpahan}
        error={error} success={success} skipGajamada={skipGajamada}
        onToggleSkip={setSkipGajamada} onSubmit={() => {}} loading={loading} pengaduan={pengaduan} isDone />
    </AksiCard>
  )

  return (
    <AksiCard title={title} variant="default">
      <div className="space-y-2">
        <div className="flex gap-0 border-b border-gray-700 -mx-2 px-2">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key ? "text-white border-blue-400 bg-blue-900/20" : "text-gray-400 border-transparent hover:text-gray-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "proses_lidik" && (
          <ProsesLidikTab
            skipGajamada={skipGajamada} onToggleSkip={setSkipGajamada}
            updatingStatus={updatingStatus}
            pemberitahuanAwal={pemberitahuanAwal} setPemberitahuanAwal={setPemberitahuanAwal}
            uuk={uuk} setUuk={setUuk} sprin={sprin} setSprin={setSprin}
            onUpdateStatusLidik={handleUpdateStatusLidik}
            customTemplates={customTemplates} onSimpanDok={simpanDok}
          />
        )}

        {activeTab === "pelaporan" && (
          <PelaporanTab
            hasil={hasil} onSetHasil={setHasil} onSetPelimpahan={setPelimpahan}
            gelarBlock={gelarBlock} setGelarBlock={setGelarBlock}
            lhp={lhp} setLhp={setLhp} nodin={nodin} setNodin={setNodin}
            skipGajamada={skipGajamada} onToggleSkip={setSkipGajamada}
            loading={loading} pelanggarList={pelanggarList}
            onStageUpdate={handleStageUpdate}
            customTemplates={customTemplates} onSimpanDok={simpanDok}
          />
        )}

        {activeTab === "terbukti" && (
          <PelanggarTab
            pelanggarList={pelanggarList} setPelanggarList={setPelanggarList}
            catalogPasal={catalogPasal} catalogWujud={catalogWujud}
            loading={loading} error={error} success={success}
            onSavePelanggar={handleSavePelanggar}
            onReset={() => { if (confirm("Reset semua data terduga pelanggar?")) setPelanggarList([]) }}
            skipGajamada={skipGajamada}
          />
        )}

        {activeTab === "tindak_lanjut" && (
          <TindakLanjutTab
            hasil={hasil} tlList={tlList} pelanggarList={pelanggarList}
            pelimpahan={pelimpahan} unitOptions={catalogUnit}
            onToggleTl={toggleTl} onSetTlNomor={setTlNomor}
            onSetPelimpahan={setPelimpahan} copied={copied} onSalinRekap={salinRekap}
            isDone={false} targetStatus="" onSetTargetStatus={() => {}}
            sprinHenti={sprinHenti} setSprinHenti={setSprinHenti}
            pemAnkum={pemAnkum} setPemAnkum={setPemAnkum}
            customTemplates={customTemplates} onSimpanDok={simpanDok}
          />
        )}

        {activeTab === "rekap" && (
          <RekapTab
            stage={stage} hasil={hasil} gelarTgl={gelarBlock.tanggal} gelarNo={gelarBlock.nomor}
            tlList={tlList} pelanggarList={pelanggarList} pelimpahan={pelimpahan}
            error={error} success={success} skipGajamada={skipGajamada}
            onToggleSkip={setSkipGajamada}
            onSubmit={() => handleStageUpdate(hasil)}
            loading={loading} pengaduan={pengaduan} isDone={false}
          />
        )}
      </div>
    </AksiCard>
  )
}
```

- [ ] **Step 2: Run `npm run build` to check for compilation errors**

Run: `npm run build`
Expected: No TypeScript errors.

- [ ] **Step 3: Fix any import or type errors from build output**

---

### Task 10: Add `limpahkan` action to API route

**Files:**
- Modify: `src/app/api/unit/route.ts`

**Interfaces:**
- Consumes: `executeGajamadaGateway`, `GATEWAY_KASUBBID_TERIMA` from gateway
- Produces: New `case "limpahkan"` block

- [ ] **Step 1: Add `limpahkan` case after `pelaporan` case (before `save_pelanggar`)**

In `src/app/api/unit/route.ts`, find the closing `}` of the `pelaporan` case (the `return NextResponse.json(...)` line ~526). After it, before `case "save_pelanggar"`, insert:

```typescript
      case "limpahkan": {
        const { target_status, target_case_position, pelanggar_list, tindak_lanjut, gelar_tanggal, gelar_notulen, pelimpahan, hasil } = body

        const gajamadaStatus = target_status || "Laporan Dikirim ke Satker"
        const targetPosition = target_case_position || currentPosition

        const gajamadaAttachments: { url: string; file_name: string }[] = []

        for (const file of uploadedFiles) {
          const fileExt = file.name.split(".").pop()
          const fileName = `${pengaduanId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          const arrayBuffer = await file.arrayBuffer()
          const buffer = new Uint8Array(arrayBuffer)
          const { error: uploadErr } = await supabase.storage.from("dokumen_perkara").upload(fileName, buffer, { contentType: file.type })
          if (uploadErr) continue
          const { data: publicUrl } = supabase.storage.from("dokumen_perkara").getPublicUrl(fileName)
          let gajamadaUrl = publicUrl.publicUrl
          try { const res = await uploadToGajamada(buffer, file.name, file.type); gajamadaUrl = res.path } catch (e) {}
          gajamadaAttachments.push({ url: gajamadaUrl, file_name: file.name })
          await supabase.from("attachments").insert({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            pengaduan_id: pengaduanId, url: publicUrl.publicUrl, file_name: file.name, file_type: file.type, doc_type: null,
          })
        }

        // 1 gateway call: update status + case_position
        await callGajamada({
          report_id: prepetratorId,
          note: `PELIMPAHAN — Hasil: ${hasil || "terbukti"} — Tujuan: ${pelimpahan || targetPosition}`,
          createdBy: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          case_handover: pelimpahan || targetPosition,
          status: gajamadaStatus,
          case_position: targetPosition,
          attachments: gajamadaAttachments.length > 0 ? gajamadaAttachments : undefined,
        }, skip_gajamada)

        // Save pelanggar snapshot
        if (pelanggar_list && Array.isArray(pelanggar_list)) {
          await supabase.from("pelanggar_paminal").insert({
            pengaduan_id: pengaduanId,
            data: JSON.parse(JSON.stringify(pelanggar_list)),
          })
        }

        const tlLines: string[] = []
        if (tindak_lanjut && Array.isArray(tindak_lanjut)) {
          for (const tl of tindak_lanjut) { if (tl.checked) tlLines.push(`${tl.label}: ${tl.nomor || "-"}`) }
        }

        const pelanggarNames = pelanggar_list?.map((p: any) => `${p.nama} / NRP: ${p.nrp || "-"}`).join("; ") ?? ""

        const updates: Record<string, unknown> = {
          unit_status: "pelaporan_selesai",
          unit_completed_at: new Date().toISOString(),
          unit_progress: `Limpah ke: ${pelimpahan || targetPosition}`,
          case_position: targetPosition,
          status_label: gajamadaStatus,
          previous_case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          synced_at: new Date().toISOString(),
        }
        await supabase.from("pengaduan").update(updates).eq("id", pengaduanId)

        const catatanContent = [
          `[PELIMPAHAN] Hasil: ${hasil || "terbukti"}`,
          gelar_tanggal ? `Gelar Perkara: ${gelar_tanggal}${gelar_notulen ? ` — No: ${gelar_notulen}` : ""}` : "",
          pelanggarNames ? `Pelanggar: ${pelanggarNames}` : "",
          `Pelimpahan ke: ${pelimpahan || targetPosition}`,
          `Status: ${gajamadaStatus}`,
          tlLines.length > 0 ? `Tindak Lanjut:\n${tlLines.join("\n")}` : "",
        ].filter(Boolean).join("\n")

        if (catatanContent.trim()) {
          await supabase.from("catatan").insert({
            pengaduan_id: pengaduanId, prepetrator_id: prepetratorId,
            author_email: "system@propam.polri.go.id", author_role: "paminal",
            content: catatanContent,
          })
        }

        return NextResponse.json({ success: true, message: `Pelimpahan ke ${pelimpahan || targetPosition}` })
      }
```

- [ ] **Step 2: Run build to verify**

Run: `npm run build`

---

### Task 11: Update `pelaporan` action for tidak_terbukti field persistence

**Files:**
- Modify: `src/app/api/unit/route.ts` (modify existing `pelaporan` case)

- [ ] **Step 1: In the existing `pelaporan` case (~line 278-527), add pelanggar_paminal save + handle tidak_terbukti status**

After the `if (catatanContent.trim())` block near the end of the `pelaporan` case, add pelanggar snapshot:

```typescript
        // Save pelanggar snapshot if terbukti
        if (terbukti && pelanggar_list && Array.isArray(pelanggar_list)) {
          await supabase.from("pelanggar_paminal").insert({
            pengaduan_id: pengaduanId,
            data: JSON.parse(JSON.stringify(pelanggar_list)),
          })
        }

        return NextResponse.json({ success: true, message: "Pelaporan selesai" })
```

Also update the `status_label` assignment in the pelaporan case to handle `tidak_terbukti`:

Change the line:
```typescript
const gajamadaStatus = terbukti ? "LAPORAN SELESAI" : hasil === "perdamaian" ? "RESTORATIVE JUSTICE" : "Selesai"
```

To:
```typescript
const gajamadaStatus = terbukti ? "LAPORAN SELESAI"
  : hasil === "perdamaian" ? "RESTORATIVE JUSTICE"
  : hasil === "tidak_terbukti" ? "TIDAK TERBUKTI"
  : "Selesai"
```

And update the `case_position` for tidak_terbukti:
```typescript
const finalCasePosition = terbukti && pelimpahan ? pelimpahan : currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT"
```

- [ ] **Step 2: Run build**

Run: `npm run build`

---

### Task 12: Integration test — verify tabs render and API flows

**Files:**
- No new files. Manual verification.

- [ ] **Step 1: Run the app locally**

Run: `npm run dev`

- [ ] **Step 2: Navigate to dashboard, open Paminal card, verify:**
  - Tab Proses Lidik: DocBlock fields render, upload works, "Update Status" button
  - Tab Pelaporan: Hasil Lidik dropdown, stage update works
  - Tab Pelanggar (when hasil=terbukti): full editor renders
  - Tab Tindak Lanjut: terbukti→pelimpahan combobox, tidak_terbukti→sprin_henti+Ankum blocks
  - Tab Rekap: ringkasan + "Selesai & Kirim" button

- [ ] **Step 3: Test pelimpahan flow:**
  - Set hasil=terbukti, pilih pelimpahan, submit
  - Verify gateway call, Supabase update, pelanggar_paminal saved

- [ ] **Step 4: Test tidak_terbukti flow:**
  - Set hasil=tidak_terbukti, fill sprin_henti docs, submit
  - Verify status=TIDAK TERBUKTI, case_position unchanged

- [ ] **Step 5: Verify isDone state renders RekapTab read-only**

- [ ] **Step 6: Verify no TypeScript or lint errors**

Run: `npm run build`

---

## Self-Review

1. **Placeholder scan**: PelanggarTab (Task 6) is an extraction — needs exact code from monolit. Other tasks have complete code.
2. **Type consistency**: `TindakLanjutTabProps`, `RekapTabProps`, `DocBlock` all exported from `paminal-shared.ts`. Props interfaces match component usage.
3. **No TBDs**: All steps have concrete code or explicit verification commands.
4. **Spec coverage**: All 6 spec items have corresponding tasks (1=migration, 2-8=modularization, 9=orchestrator, 10-11=API, 12=integration).
