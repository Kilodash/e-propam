# Redesign Card Aksi Provos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign provos action card from 5 tabs to 3 tabs (Pemeriksaan Awal, Sidang, Rekap) following SOP flow.

**Architecture:** Component-per-tab pattern matching paminal structure. `aksi-provos.tsx` becomes orchestrator with state management. Three new tab components in `provos/` directory. API extends `/api/unit` with three new actions.

**Tech Stack:** React 18, Next.js 16, TypeScript, Supabase, Tailwind CSS, lucide-react

## Global Constraints

- Provider: anthropic
- Model: claude-4-sonnet
- Follow existing paminal component patterns exactly (prop interfaces, file structure, naming)
- Use `src/components/pengaduan/paminal/paminal-shared.ts` types when shared; define Provos-only types locally
- Template format uses `HUK.12.10.` constant prefix for provos documents
- 1 sidang = 1 pelanggar; N sidang per pengaduan
- Perdamaian reuse paminal dialog pattern
- Putusan Sidang = multi-select from 7 PP No.2/2003 options
- Banding = checkbox + date with max 14-day validation
- Skip gajamada integration for new actions (save to Supabase only for now)

---

### Task 1: Update template-nomor.ts with Provos formats

**Files:**
- Modify: `src/lib/template-nomor.ts`

**Interfaces:**
- Produces: `DOC_TEMPLATES` with new keys: `gelar_provos`, `sprin_riksa`, `khd`; updated `lp_a`, `dp3d`

- [ ] **Step 1: Add/update template entries**

```ts
// Replace existing templates for provos doc types:
export const DOC_TEMPLATES: Record<string, string> = {
  // ... keep all existing entries ...
  // pem_pelapor, pem_ankum, etc. unchanged

  // UPDATE: lp_a for provos format
  lp_a: "LP-A/{no}/{rom}/HUK.12.10./{thn}/{unit}",
  // UPDATE: dp3d for provos format with -K
  dp3d: "DP3D/{no}/-K/{rom}/HUK.12.10./{thn}/{unit}",
  // NEW:
  gelar_provos: "Notulen/{no}/{rom}/HUK.12.10./{thn}/{unit}",
  sprin_riksa: "Sprin.Riksa/{no}/{rom}/HUK.12.10./{thn}",
  khd: "KHD/{no}/{rom}/HUK.12.10./{thn}/{unit}",
  // Keep existing sprin_provos untouched (may be used elsewhere)
}
```

- [ ] **Step 2: Verify no compilation errors**

Run: `npx tsc --noEmit`
Expected: Zero errors from template-nomor.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/template-nomor.ts
git commit -m "feat(provos): add gelar_provos, sprin_riksa, khd templates with HUK.12.10. format"
```

---

### Task 2: Add Provos doc types to doc-block autoFill

**Files:**
- Modify: `src/components/pengaduan/paminal/doc-block.tsx:17`

**Interfaces:**
- Consumes: new doc types from Task 1
- Produces: autoFill works for `gelar_provos`, `sprin_riksa`, `khd`

- [ ] **Step 1: Add doc types to autoFill list**

Find line 17:
```ts
const autoFillDocTypes = ["pemberitahuan_awal", "uuk", "sprinlidik", "notulen_gelar", "lhp", "nota_dinas", "surat", "sprin_henti", "str_jukrah", "sp2hp2", "pem_ankum", "pem_pelapor", "sprin_provos", "dp3d", "bap", "sprin_sidang", "notulen_sidang", "putusan_disiplin"]
```

Replace with:
```ts
const autoFillDocTypes = ["pemberitahuan_awal", "uuk", "sprinlidik", "notulen_gelar", "lhp", "nota_dinas", "surat", "sprin_henti", "str_jukrah", "sp2hp2", "pem_ankum", "pem_pelapor", "sprin_provos", "dp3d", "bap", "sprin_sidang", "notulen_sidang", "putusan_disiplin", "gelar_provos", "sprin_riksa", "khd"]
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pengaduan/paminal/doc-block.tsx
git commit -m "feat(provos): add gelar_provos, sprin_riksa, khd to doc-block autoFill list"
```

---

### Task 3: Create shared Provos types and constants

**Files:**
- Create: `src/components/pengaduan/provos/provos-shared.ts`

**Interfaces:**
- Produces: `SidangEntry`, `PUTUSAN_OPTIONS`, `PUTUSAN_SIDANG` constant, `PelanggarProvos` type

- [ ] **Step 1: Create provos-shared.ts**

```ts
export interface PelanggarProvos {
  key: string
  prepetrator_id: string
  nama: string
  pangkat: string
  nrp: string
  jabatan: string
  kesatuan: string
  source: "paminal" | "provos"  // who added this pelanggar
}

export const PUTUSAN_SIDANG = [
  "Teguran tertulis",
  "Penundaan mengikuti pendidikan paling lama 1 tahun",
  "Penundaan kenaikan gaji berkala",
  "Penundaan kenaikan pangkat paling lama 1 tahun",
  "Mutasi yang bersifat demosi",
  "Pembebasan dari jabatan",
  "Penempatan dalam tempat khusus paling lama 21 hari",
] as const

export type PutusanValue = typeof PUTUSAN_SIDANG[number]

export interface SidangEntry {
  key: string
  pelanggar: PelanggarProvos | null
  khdTanggal: string
  khdNomor: string
  khdFiles: File[]
  khdUploadedFiles: { url: string; file_name: string }[]
  khdSaving: boolean
  khdSaved: boolean
  putusan: PutusanValue[]
  patsusDiperberat: boolean
  banding: boolean
  bandingTanggal: string
  bandingMemo: string
}

export function emptySidangEntry(): SidangEntry {
  return {
    key: crypto.randomUUID(),
    pelanggar: null,
    khdTanggal: "",
    khdNomor: "",
    khdFiles: [],
    khdUploadedFiles: [],
    khdSaving: false,
    khdSaved: false,
    putusan: [],
    patsusDiperberat: false,
    banding: false,
    bandingTanggal: "",
    bandingMemo: "",
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pengaduan/provos/provos-shared.ts
git commit -m "feat(provos): add shared types for SidangEntry, PelanggarProvos, putusan constants"
```

---

### Task 4: Create PemeriksaanAwalTab component

**Files:**
- Create: `src/components/pengaduan/provos/pemeriksaan-awal-tab.tsx`

**Interfaces:**
- Consumes: `DocBlock` from `paminal-shared`, `DocBlockProps` from `doc-block`
- Produces: `PemeriksaanAwalTab` component with 5 sections

- [ ] **Step 1: Create the component file**

```tsx
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DocBlock } from "../paminal/doc-block"
import { SYARAT_MATERIIL, SYARAT_PEMBATAS, SYARAT_FORMIL } from "../paminal/paminal-shared"
import type { DocBlock as DocBlockType } from "../paminal/paminal-shared"

interface Props {
  updateGajamada: boolean
  onToggleUpdate: (v: boolean) => void
  gelarBlock: DocBlockType
  setGelarBlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  lpABlock: DocBlockType
  setLpABlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  sprinRiksaBlock: DocBlockType
  setSprinRiksaBlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  dp3dBlock: DocBlockType
  setDp3dBlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlockType, setter: React.Dispatch<React.SetStateAction<DocBlockType>>) => Promise<void>
}

export default function PemeriksaanAwalTab({
  updateGajamada, onToggleUpdate,
  gelarBlock, setGelarBlock,
  lpABlock, setLpABlock,
  sprinRiksaBlock, setSprinRiksaBlock,
  dp3dBlock, setDp3dBlock,
  customTemplates, onSimpanDok,
}: Props) {
  const [showPerdamaian, setShowPerdamaian] = useState(false)
  const [materiil, setMateriil] = useState<Record<string, boolean>>({})
  const [pembatas, setPembatas] = useState<Record<string, boolean>>({})
  const [formil, setFormil] = useState<Record<string, boolean>>({})

  const allMateriil = SYARAT_MATERIIL.every(s => materiil[s.key])
  const allPembatas = SYARAT_PEMBATAS.every(s => pembatas[s.key])
  const allFormil = SYARAT_FORMIL.every(s => formil[s.key])
  const canPerdamaian = allMateriil && allPembatas && allFormil

  return (
    <div className="space-y-3">
      <DocBlock title="Gelar Perkara Provos" docType="gelar_provos" block={gelarBlock} setter={setGelarBlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="Laporan Polisi" docType="lp_a" block={lpABlock} setter={setLpABlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="Sprin Riksa" docType="sprin_riksa" block={sprinRiksaBlock} setter={setSprinRiksaBlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="Berkas DP3D" docType="dp3d" block={dp3dBlock} setter={setDp3dBlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />

      <button
        onClick={() => setShowPerdamaian(true)}
        disabled={dp3dBlock.nomor !== ""} // Hanya sebelum DP3D di-submit. ponytail: check via dokumen_perkara instead
        className="w-full flex items-center justify-center gap-1 text-sm px-2 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
        title={dp3dBlock.nomor ? "DP3D sudah disimpan — perdamaian harus sebelum DP3D" : "Buka dialog perdamaian"}
      >
        Perdamaian
      </button>

      <Dialog open={showPerdamaian} onOpenChange={setShowPerdamaian}>
        <DialogContent className="max-w-md bg-[#0F172A] border-gray-700 text-white">
          <DialogHeader><DialogTitle className="text-white">Perdamaian (Restorative Justice)</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-gray-300 mb-1">Syarat Materiil</p>
              {SYARAT_MATERIIL.map(s => (
                <label key={s.key} className="flex items-start gap-1.5 text-gray-400 py-0.5 cursor-pointer">
                  <input type="checkbox" checked={materiil[s.key] ?? false} onChange={e => setMateriil(p => ({ ...p, [s.key]: e.target.checked }))} className="mt-0.5 w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
            <div>
              <p className="font-semibold text-gray-300 mb-1">Prinsip Pembatas</p>
              {SYARAT_PEMBATAS.map(s => (
                <label key={s.key} className="flex items-start gap-1.5 text-gray-400 py-0.5 cursor-pointer">
                  <input type="checkbox" checked={pembatas[s.key] ?? false} onChange={e => setPembatas(p => ({ ...p, [s.key]: e.target.checked }))} className="mt-0.5 w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
            <div>
              <p className="font-semibold text-gray-300 mb-1">Syarat Formil</p>
              {SYARAT_FORMIL.map(s => (
                <label key={s.key} className="flex items-start gap-1.5 text-gray-400 py-0.5 cursor-pointer">
                  <input type="checkbox" checked={formil[s.key] ?? false} onChange={e => setFormil(p => ({ ...p, [s.key]: e.target.checked }))} className="mt-0.5 w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
            <div className={`text-sm font-semibold p-2 rounded ${canPerdamaian ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"}`}>
              {canPerdamaian ? "Semua syarat terpenuhi. Perdamaian dapat dilakukan." : "Belum semua syarat terpenuhi."}
            </div>
            <button
              onClick={() => { setShowPerdamaian(false) }}
              disabled={!canPerdamaian}
              className="w-full px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded disabled:opacity-40"
            >
              Ajukan Perdamaian
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
        <input type="checkbox" checked={updateGajamada} onChange={e => onToggleUpdate(e.target.checked)} className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
        Update Timeline Gajamada
      </label>
    </div>
  )
}
```

Wait — `useState` not imported. Add at top:
```tsx
import { useState } from "react"
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors in pemeriksaan-awal-tab.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/pengaduan/provos/pemeriksaan-awal-tab.tsx
git commit -m "feat(provos): add PemeriksaanAwalTab with gelar, LP-A, SprinRiksa, DP3D, Perdamaian dialog"
```

---

### Task 5: Create SidangEntry component (single sidang form)

**Files:**
- Create: `src/components/pengaduan/provos/sidang-entry.tsx`

**Interfaces:**
- Consumes: `SidangEntry`, `PUTUSAN_SIDANG` from `provos-shared`, `PelanggarProvos` from either `provos-shared` or `PelanggarItem` from `paminal-shared`
- Produces: `SidangEntryComp` component (1 sidang form)

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { DateInput } from "@/components/ui/date-input"
import { buildNomor } from "@/lib/template-nomor"
import type { PelanggarItem } from "../paminal/paminal-shared"
import type { SidangEntry as SidangEntryType, PutusanValue } from "./provos-shared"
import { PUTUSAN_SIDANG } from "./provos-shared"

interface Props {
  entry: SidangEntryType
  index: number
  pelanggarOptions: PelanggarItem[]  // all available pelanggar (paminal + provos)
  onUpdate: (key: string, updates: Partial<SidangEntryType>) => void
  onDelete: (key: string) => void
  customTemplates: Record<string, string>
}

function toRoman(n: number): string {
  const r = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"]
  return r[n-1] || String(n)
}

export default function SidangEntryComp({
  entry, index, pelanggarOptions, onUpdate, onDelete, customTemplates,
}: Props) {
  const [showTambah, setShowTambah] = useState(false)

  function handleTglSidang(val: string) {
    let nextNomor = entry.khdNomor
    if (val) {
      const d = new Date(val + "T00:00:00")
      const generated = buildNomor("khd", "     ", d.getMonth() + 1, d.getFullYear(), "Subbid Provos", customTemplates)
      if (!nextNomor) nextNomor = generated
    }
    onUpdate(entry.key, { khdTanggal: val, khdNomor: nextNomor })
  }

  function togglePutusan(v: PutusanValue) {
    const next = entry.putusan.includes(v)
      ? entry.putusan.filter(p => p !== v)
      : [...entry.putusan, v]
    onUpdate(entry.key, { putusan: next, patsusDiperberat: next.includes("Penempatan dalam tempat khusus paling lama 21 hari") ? entry.patsusDiperberat : false })
  }

  const hasPatsus = entry.putusan.includes("Penempatan dalam tempat khusus paling lama 21 hari")

  return (
    <div className="border border-gray-600 rounded p-3 space-y-2 bg-[#0F172A]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">Sidang #{index + 1}</span>
        <button onClick={() => onDelete(entry.key)} className="text-red-400 hover:text-red-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* a. Identitas Terduga Pelanggar */}
      <div>
        <p className="text-sm text-gray-500 mb-0.5">Identitas Terduga Pelanggar</p>
        {entry.pelanggar ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-200 bg-[#1E293B] px-2 py-0.5 rounded">
              {entry.pelanggar.nama} ({entry.pelanggar.pangkat}) — NRP: {entry.pelanggar.nrp}
            </span>
            <button onClick={() => onUpdate(entry.key, { pelanggar: null })} className="text-sm text-gray-500 hover:text-gray-300">Ganti</button>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <select
              onChange={e => {
                const val = e.target.value
                if (!val) return
                const found = pelanggarOptions.find(p => p.key === val)
                onUpdate(entry.key, { pelanggar: found as any })
              }}
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8"
            >
              <option value="">Pilih pelanggar...</option>
              {pelanggarOptions.filter(p => p.nama).map(p => (
                <option key={p.key} value={p.key}>{p.nama} / {p.pangkat} / {p.nrp}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* b. Tgl Sidang + KHD */}
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Tanggal Sidang</p>
          <DateInput value={entry.khdTanggal} onChange={handleTglSidang}
            className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Nomor KHD</p>
          <input type="text" value={entry.khdNomor}
            onChange={e => onUpdate(entry.key, { khdNomor: e.target.value })}
            placeholder="KHD/___/VII/HUK.12.10./2026/..."
            className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
        </div>
      </div>

      {/* c. Putusan Sidang */}
      <div>
        <p className="text-sm text-gray-500 mb-0.5">Putusan Sidang</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {PUTUSAN_SIDANG.map(v => (
            <label key={v} className="flex items-start gap-1.5 text-sm text-gray-300 py-0.5 cursor-pointer">
              <input type="checkbox" checked={entry.putusan.includes(v)} onChange={() => togglePutusan(v)}
                className="mt-0.5 w-3 h-3 rounded border-gray-500 bg-[#1E293B] accent-blue-500" />
              <span>{v}</span>
            </label>
          ))}
        </div>
        {hasPatsus && (
          <label className="flex items-center gap-1.5 text-sm text-amber-400 mt-1 cursor-pointer">
            <input type="checkbox" checked={entry.patsusDiperberat} onChange={e => onUpdate(entry.key, { patsusDiperberat: e.target.checked })}
              className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
            <span>Pemberatan +7 hari (total 28 hari) — darurat/operasi atau pelanggaran &gt;3x berturut-turut</span>
          </label>
        )}
      </div>

      {/* d. Banding */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={entry.banding} onChange={e => onUpdate(entry.key, { banding: e.target.checked })}
            className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
          Mengajukan Banding (maks 14 hari setelah putusan)
        </label>
        {entry.banding && (
          <div className="grid grid-cols-2 gap-1.5 pl-5">
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Tanggal Banding</p>
              <DateInput value={entry.bandingTanggal} onChange={v => onUpdate(entry.key, { bandingTanggal: v })}
                className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
              {entry.khdTanggal && entry.bandingTanggal && (
                (() => {
                  const d1 = new Date(entry.bandingTanggal)
                  const d2 = new Date(entry.khdTanggal)
                  const diff = Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
                  if (diff > 14) return <p className="text-xs text-red-400 mt-0.5">Banding melebihi 14 hari ({diff} hari)</p>
                  return null
                })()
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Memo Banding (opsional)</p>
              <input type="text" value={entry.bandingMemo}
                onChange={e => onUpdate(entry.key, { bandingMemo: e.target.value })}
                placeholder="Nomor memo..."
                className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors in sidang-entry.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/pengaduan/provos/sidang-entry.tsx
git commit -m "feat(provos): add SidangEntry component per-sidang form (pelanggar, KHD, putusan, banding)"
```

---

### Task 6: Create SidangTab component (list of sidang entries)

**Files:**
- Create: `src/components/pengaduan/provos/sidang-tab.tsx`

**Interfaces:**
- Consumes: `SidangEntry`, `emptySidangEntry` from `provos-shared`, `SidangEntryComp` from `sidang-entry`, `PelanggarItem` from `paminal-shared`
- Produces: `SidangTab` component with add/delete/list

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { Plus } from "lucide-react"
import SidangEntryComp from "./sidang-entry"
import type { SidangEntry } from "./provos-shared"
import { emptySidangEntry } from "./provos-shared"
import type { PelanggarItem } from "../paminal/paminal-shared"

interface Props {
  sidangList: SidangEntry[]
  onUpdateList: (list: SidangEntry[]) => void
  pelanggarOptions: PelanggarItem[]
  customTemplates: Record<string, string>
}

export default function SidangTab({ sidangList, onUpdateList, pelanggarOptions, customTemplates }: Props) {
  function handleUpdate(key: string, updates: Partial<SidangEntry>) {
    const next = sidangList.map(s => s.key === key ? { ...s, ...updates } : s)
    onUpdateList(next)
  }

  function handleDelete(key: string) {
    if (sidangList.length <= 1) return
    onUpdateList(sidangList.filter(s => s.key !== key))
  }

  function handleAdd() {
    onUpdateList([...sidangList, emptySidangEntry()])
  }

  return (
    <div className="space-y-3">
      {sidangList.map((entry, idx) => (
        <SidangEntryComp
          key={entry.key}
          entry={entry}
          index={idx}
          pelanggarOptions={pelanggarOptions}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          customTemplates={customTemplates}
        />
      ))}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-1 text-sm px-2 py-1.5 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded"
      >
        <Plus className="w-4 h-4" /> Tambah Sidang Baru
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors in sidang-tab.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/pengaduan/provos/sidang-tab.tsx
git commit -m "feat(provos): add SidangTab with add/delete/list of sidang entries"
```

---

### Task 7: Rewrite aksi-provos.tsx orchestrator

**Files:**
- Rewrite: `src/components/pengaduan/aksi-provos.tsx`

**Interfaces:**
- Consumes: `PemeriksaanAwalTab`, `SidangTab`, `RekapTab`, `emptyBlock`, `emptySidangEntry`, `AksiCardRenderProps`
- Produces: 3-tab provos card

- [ ] **Step 1: Replace entire file content**

```tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"
import { createClient } from "@/lib/supabase/client"
import PemeriksaanAwalTab from "./provos/pemeriksaan-awal-tab"
import SidangTab from "./provos/sidang-tab"
import RekapTab from "./paminal/rekap-tab"
import { emptyBlock } from "./paminal/paminal-shared"
import { emptySidangEntry } from "./provos/provos-shared"
import type { DocBlock, PelanggarItem, TindakLanjutItem, CatalogOptions } from "./paminal/paminal-shared"
import type { SidangEntry } from "./provos/provos-shared"

const TABS = [
  { key: "pemeriksaan_awal" as const, label: "Pemeriksaan Awal" },
  { key: "sidang" as const, label: "Sidang" },
  { key: "rekap" as const, label: "Rekap" },
]

export default function AksiProvos({ pengaduanId, prepetratorId, pengaduan, config }: AksiCardRenderProps) {
  const unitStatus = pengaduan.unit_status
  const currentPosition = pengaduan.case_position
  const isDone = unitStatus === "pelaporan_selesai" || unitStatus === "selesai"
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updateGajamada, setUpdateGajamada] = useState(true)
  const [activeTab, setActiveTab] = useState(isDone ? "rekap" : "pemeriksaan_awal")
  const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({})

  // Tab 1: Pemeriksaan Awal doc blocks
  const [gelarBlock, setGelarBlock] = useState<DocBlock>(emptyBlock())
  const [lpABlock, setLpABlock] = useState<DocBlock>(emptyBlock())
  const [sprinRiksaBlock, setSprinRiksaBlock] = useState<DocBlock>(emptyBlock())
  const [dp3dBlock, setDp3dBlock] = useState<DocBlock>(emptyBlock())

  // Tab 2: Sidang
  const [sidangList, setSidangList] = useState<SidangEntry[]>([emptySidangEntry()])

  // Pelanggar data (from paminal + provos)
  const [pelanggarList, setPelanggarList] = useState<PelanggarItem[]>([])

  // Rekap data
  const [dokumenList, setDokumenList] = useState<{ doc_type: string; nomor: string; tanggal: string }[]>([])

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(j => {
      const row = (j.data ?? []).find((r: any) => r.key === "doc_templates")
      if (row?.value) try { setCustomTemplates(row.value as Record<string, string>) } catch {}
    }).catch(() => {})

    ;(async () => {
      try {
        const supabase = createClient()
        const { data: docs } = await supabase.from("dokumen_perkara").select("doc_type, nomor, tanggal").eq("pengaduan_id", pengaduanId).order("created_at", { ascending: true })
        if (docs) setDokumenList(docs as any[])
      } catch {}
    })()

    ;(async () => {
      try {
        const gjRes = await fetch(`/api/pelanggar?prepetrator_id=${encodeURIComponent(prepetratorId)}`)
        const gjJson = await gjRes.json()
        if (gjJson.success && gjJson.data) {
          const d = gjJson.data
          const bd = d.birth_date ? new Date(Number(d.birth_date)).toISOString().split("T")[0] : ""
          let pasalD: string[] = []; let pasalK: string[] = []
          const articles = Array.isArray(d.articles) ? d.articles : []
          for (const a of articles as any[]) {
            if (!a.article_id && !a.kode_pasal) continue
            if (/perpol|kke|kode.etik/i.test(a.type || "")) pasalK.push(a.kode_pasal || a.article_id)
            else pasalD.push(a.kode_pasal || a.article_id)
          }
          setPelanggarList([{
            key: crypto.randomUUID(), prepetrator_id: prepetratorId,
            prepetrator_type: d.type || "", prepetrator_description: d.description || "",
            nama: d.name || "", pangkat: d.rank || "", nrp: d.identity_number || "",
            jabatan: d.position || "", kesatuan: d.division || "POLDA JAWA BARAT",
            functional: "", tempat_lahir: d.birth_place || "", tanggal_lahir: bd,
            telpon: d.phone_number || "", pendidikan: d.professional_education || "",
            graduation_year: d.graduation_year || "", jenis_kelamin: d.gender || "",
            wujud: d.form_of_action || "", kategori: d.category || "",
            sub_kategori: d.sub_category || "", pasal_disiplin: pasalD, pasal_kke: pasalK,
          }])
          return
        }
      } catch {}
      try {
        const supabase = createClient()
        const { data } = await supabase.from("pelanggar_paminal").select("data").eq("pengaduan_id", pengaduanId).order("created_at", { ascending: false }).limit(1).single()
        if (data?.data && Array.isArray(data.data)) setPelanggarList(data.data as PelanggarItem[])
      } catch {}
    })()
  }, [pengaduanId])

  async function simpanDok(docType: string, block: DocBlock, setter: React.Dispatch<React.SetStateAction<DocBlock>>) {
    if (!block.tanggal || !block.nomor) return
    setter(p => ({ ...p, saving: true }))
    try {
      const p = { action: "upload_only", pengaduanId, prepetratorId, dokumen: [{ doc_type: docType, nomor: block.nomor, tanggal: block.tanggal }] }
      let res
      if (block.files.length > 0) {
        const fd = new FormData(); fd.append("data", JSON.stringify(p))
        block.files.forEach(f => fd.append("files", f))
        res = await fetch("/api/unit", { method: "POST", body: fd })
      } else {
        res = await fetch("/api/unit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) })
      }
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      setter(pp => ({ ...pp, saving: false, saved: true, files: [], uploadedFiles: [...pp.uploadedFiles, ...(j.attachments ?? []) as any[]] }))
      setTimeout(() => setter(pp => ({ ...pp, saved: false })), 2000)
      refreshDokumen()
      router.refresh()
    } catch { setter(pp => ({ ...pp, saving: false })) }
  }

  async function refreshDokumen() {
    try {
      const s = createClient()
      const { data: docs } = await s.from("dokumen_perkara").select("doc_type,nomor,tanggal").eq("pengaduan_id", pengaduanId).order("created_at", { ascending: true })
      if (docs) setDokumenList(docs as any[])
    } catch {}
  }

  async function handleFinalize() {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize_provos",
          pengaduanId, prepetratorId,
          currentPosition: currentPosition || "KASUBBID PROVOS POLDA JAWA BARAT",
          sidang_list: sidangList.map(s => ({
            pelanggar_key: s.pelanggar?.key,
            pelanggar_nama: s.pelanggar?.nama,
            pelanggar_nrp: s.pelanggar?.nrp,
            khd_tanggal: s.khdTanggal,
            khd_nomor: s.khdNomor,
            putusan: s.putusan,
            patsus_diperberat: s.patsusDiperberat,
            banding: s.banding,
            banding_tanggal: s.bandingTanggal,
            banding_memo: s.bandingMemo,
          })),
          skip_gajamada: !updateGajamada,
        }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      setSuccess(j.message)
      router.refresh()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  const title = (config?.title as string) ?? "Proses Provos"

  if (isDone) {
    return (
      <AksiCard title={title} variant="default">
        <RekapTab stage="pelaporan" hasil="" gelarTgl="" gelarNo="" tlList={[]} pelanggarList={pelanggarList} pelimpahan=""
          error={error} success={success} updateGajamada={updateGajamada} onToggleUpdate={setUpdateGajamada}
          onSubmit={async () => {}} loading={loading} pengaduan={pengaduan} isDone pengaduanId={pengaduanId}
          dokumenList={dokumenList} pelimpahanKe="" pelimpahanNomor="" pelimpahanTgl="" />
      </AksiCard>
    )
  }

  return (
    <AksiCard title={title} variant="default">
      <div className="space-y-2">
        <div className="flex gap-0 border-b border-gray-700 -mx-2 px-2">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key ? "text-white border-blue-400 bg-blue-900/20" : "text-gray-400 border-transparent hover:text-gray-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "pemeriksaan_awal" && (
          <PemeriksaanAwalTab
            updateGajamada={updateGajamada} onToggleUpdate={setUpdateGajamada}
            gelarBlock={gelarBlock} setGelarBlock={setGelarBlock}
            lpABlock={lpABlock} setLpABlock={setLpABlock}
            sprinRiksaBlock={sprinRiksaBlock} setSprinRiksaBlock={setSprinRiksaBlock}
            dp3dBlock={dp3dBlock} setDp3dBlock={setDp3dBlock}
            customTemplates={customTemplates} onSimpanDok={simpanDok}
          />
        )}

        {activeTab === "sidang" && (
          <SidangTab
            sidangList={sidangList}
            onUpdateList={setSidangList}
            pelanggarOptions={pelanggarList}
            customTemplates={customTemplates}
          />
        )}

        {activeTab === "rekap" && (
          <RekapTab stage="pelaporan" hasil="" gelarTgl="" gelarNo="" tlList={[]} pelanggarList={pelanggarList} pelimpahan=""
            error={error} success={success} updateGajamada={updateGajamada} onToggleUpdate={setUpdateGajamada}
            onSubmit={handleFinalize} loading={loading} pengaduan={pengaduan} isDone={false} pengaduanId={pengaduanId}
            dokumenList={dokumenList} pelimpahanKe="" pelimpahanNomor="" pelimpahanTgl="" />
        )}
      </div>
    </AksiCard>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors in aksi-provos.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/pengaduan/aksi-provos.tsx
git commit -m "feat(provos): rewrite aksi-provos to 3-tab orchestrator (Pemeriksaan Awal, Sidang, Rekap)"
```

---

### Task 8: Add API handlers (save_sidang, delete_sidang, finalize_provos)

**Files:**
- Modify: `src/app/api/unit/route.ts`

**Interfaces:**
- Produces: three new action cases in the switch statement

- [ ] **Step 1: Add cases to the switch before the `default:` case**

After line ~750 (before `default:`), insert:

```ts
case "save_sidang": {
  const { sidang_entries, skipGajamada } = body
  if (!sidang_entries || !Array.isArray(sidang_entries)) {
    return NextResponse.json({ success: false, error: "sidang_entries wajib" }, { status: 400 })
  }

  const unitLabel = "Subbid Provos"
  const now = new Date()
  const year = now.getFullYear()
  const results: string[] = []

  for (const s of sidang_entries) {
    if (!s.khd_tanggal || !s.khd_nomor) continue
    const { nextNumber } = await incrementRegister(unitLabel, "khd", year)
    const nomor = s.khd_nomor || buildNomor("khd", nextNumber, new Date(s.khd_tanggal).getMonth() + 1, year, unitLabel, customTemplates)
    await supabase.from("dokumen_perkara").insert({
      pengaduan_id: pengaduanId,
      doc_type: "khd",
      nomor,
      tanggal: s.khd_tanggal,
      keterangan: JSON.stringify({
        pelanggar_nama: s.pelanggar_nama,
        pelanggar_nrp: s.pelanggar_nrp,
        putusan: s.putusan,
        patsus_diperberat: s.patsus_diperberat,
        banding: s.banding,
        banding_tanggal: s.banding_tanggal,
        banding_memo: s.banding_memo,
      }),
      stage: "sidang",
      file_url: null,
      created_by: "system",
    })
    results.push(s.khd_nomor)
  }

  return NextResponse.json({ success: true, message: `${results.length} sidang disimpan` })
}

case "finalize_provos": {
  const { sidang_list, skipGajamada } = body
  const casePosition = currentPosition || "KASUBBID PROVOS POLDA JAWA BARAT"

  const catatanLines: string[] = ["[PROVOS SELESAI]"]
  if (sidang_list && Array.isArray(sidang_list)) {
    for (const s of sidang_list) {
      if (!s.khd_tanggal) continue
      catatanLines.push(`Sidang: ${s.khd_tanggal} | KHD: ${s.khd_nomor || "-"} | Pelanggar: ${s.pelanggar_nama || "-"} | Putusan: ${(s.putusan || []).join(", ") || "-"}${s.banding ? ` | Banding: ${s.banding_tanggal || "-"}` : ""}`)
    }
  }

  await supabase.from("catatan").insert({
    pengaduan_id: pengaduanId,
    prepetrator_id: prepetratorId,
    author_email: "system@propam.polri.go.id",
    author_role: "provos",
    content: catatanLines.join("\n"),
  })

  await supabase.from("pengaduan").update({
    unit_status: "pelaporan_selesai",
    unit_completed_at: new Date().toISOString(),
    case_position: casePosition,
    status_label: "Selesai",
    synced_at: new Date().toISOString(),
  }).eq("id", pengaduanId)

  return NextResponse.json({ success: true, message: "Proses provos selesai" })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors in route.ts

- [ ] **Step 3: Commit**

```bash
git add src/app/api/unit/route.ts
git commit -m "feat(provos): add save_sidang and finalize_provos API actions"
```

---

### Task 9: Build verification

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Fix any remaining issues**

If build fails, fix and re-commit.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat(provos): complete provos card redesign to 3-tab with pemeriksaan, sidang, rekap"
```

---

### Task 10: Optional — Pelanggar Provos persistence

**Files:**
- Create: `supabase/migrations/022_provos_pelanggar_source.sql`

**Note:** Only run if `pelanggar_paminal` needs a `source` column.

- [ ] **Step 1: Add source column**

```sql
ALTER TABLE pelanggar_paminal ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'paminal';
```

- [ ] **Step 2: Run migration**

```bash
npx supabase migration up
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/022_provos_pelanggar_source.sql
git commit -m "chore(provos): add source column to pelanggar_paminal"
```
