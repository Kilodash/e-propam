# Unit Tindak Lanjut Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Card Buat Laporan (Lapinfo/LP-A) + Card Proses 4-Stage Paminal + Buku Register auto-increment nomor.

**Architecture:** Extend `pengaduan` table with `source`/`source_type`/`source_unit` columns for internal reports. New `buku_register` table for sequential document numbering per unit/type/year. New `dokumen_perkara` table for documents attached to cases. Two new card components (Buat Laporan on unit dashboard, Proses Paminal on pengaduan detail) sharing a reusable `DocTemplateInput` for template-number fields.

**Tech Stack:** Next.js 16 App Router, Supabase, React 19, Tailwind v4, TypeScript 5

## Global Constraints

- Non-blocking: all fields optional, no upload required, can skip stages
- gajamada_name immutable, only normalized_name editable
- Status pattern-based via categorizeStatus()
- No direct brain file edits — use `brain` CLI
- Respect existing file conventions: "use client" for components, createServiceClient() for server, useRouter().refresh() after mutations
- Compact UI: text-xs for labels, h-8 buttons, p-2 card padding (existing pattern)
- Month-to-Roman conversion: 1:I 2:II 3:III 4:IV 5:V 6:VI 7:VII 8:VIII 9:IX 10:X 11:XI 12:XII

---

### Task 0: Dev Unit Selector — dropdown unit di navbar

**Files:**
- Modify: `src/components/layout/dev-role-switcher.tsx` — tambah unit selector
- Create: `src/components/layout/dev-unit-switcher.tsx`

**Interfaces:**
- Consumes: `/api/units` (existing endpoint, returns unit_mapping data)
- Produces: Dropdown unit selector di navbar, set `dev-unit` cookie

- [ ] **Step 1: Create dev-unit-switcher.tsx**

```typescript
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface UnitOption {
  value: string
  label: string
}

const ROLE_POLICE_FN_MAP: Record<string, string> = {
  paminal: "PAMINAL",
  provos: "PROVOS",
  wabprof: "WABPROF",
  rehabpers: "REHABPERS",
}

export default function DevUnitSwitcher({ role }: { role: string }) {
  const [units, setUnits] = useState<UnitOption[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!role) return
    const policeFn = ROLE_POLICE_FN_MAP[role]
    if (!policeFn && role !== "polres") return
    const url = policeFn
      ? `/api/units?police_function=${policeFn}`
      : "/api/units"
    fetch(url)
      .then(r => r.json())
      .then(json => {
        const data = (json.data ?? []) as any[]
        setUnits(data.map((u: any) => ({
          value: u.gajamada_name,
          label: u.gajamada_name,
        })).sort((a: any, b: any) => a.label.localeCompare(b.label)))
      })
      .catch(() => {})
  }, [role])

  if (units.length === 0) return null

  function selectUnit(unitName: string) {
    document.cookie = `dev-unit=${encodeURIComponent(unitName)};path=/;max-age=86400`
    router.refresh()
  }

  return (
    <select
      className="bg-[#1e293b] border border-gray-600 text-gray-200 text-xs px-2 py-1 rounded"
      onChange={(e) => selectUnit(e.target.value)}
      defaultValue=""
    >
      <option value="" disabled>Pilih Unit</option>
      {units.map(u => (
        <option key={u.value} value={u.value}>{u.label}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: Update navbar.tsx — tambah DevUnitSwitcher**

Add import: `import DevUnitSwitcher from "./dev-unit-switcher"`
Read role from cookie: get `dev-role` cookie value
Render `<DevUnitSwitcher role={resolvedRole} />` di samping DevRoleSwitcher

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/dev-unit-switcher.tsx src/components/layout/navbar.tsx
git commit -m "feat: dev unit selector for role-specific unit filtering"
```

---

### Task 1: Migration — source fields, buku_register, dokumen_perkara

**Files:**
- Create: `supabase/migrations/010_unit_tindaklanjut.sql`

**Interfaces:**
- Produces: `pengaduan.source TEXT DEFAULT 'gajamada'`, `pengaduan.source_type TEXT` (lapinfo|lp_a), `pengaduan.source_unit TEXT` (paminal|provos|wabprof), `buku_register` table, `dokumen_perkara` table

- [ ] **Step 1: Write migration file**

```sql
-- 010_unit_tindaklanjut.sql
-- Add internal report source fields to pengaduan

ALTER TABLE public.pengaduan ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE public.pengaduan ADD COLUMN IF NOT EXISTS source_unit TEXT;
ALTER TABLE public.pengaduan ALTER COLUMN source SET DEFAULT 'gajamada';

-- Buku Register — sequential document numbering per unit/type/year
CREATE TABLE IF NOT EXISTS public.buku_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unit, doc_type, year)
);

ALTER TABLE public.buku_register ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read buku_register" ON public.buku_register;
CREATE POLICY "Authenticated users can read buku_register" ON public.buku_register
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert buku_register" ON public.buku_register;
CREATE POLICY "Authenticated users can insert buku_register" ON public.buku_register
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update buku_register" ON public.buku_register;
CREATE POLICY "Authenticated users can update buku_register" ON public.buku_register
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Dokumen Perkara — documents attached to pengaduan
CREATE TABLE IF NOT EXISTS public.dokumen_perkara (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id TEXT REFERENCES public.pengaduan(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  nomor TEXT NOT NULL,
  tanggal DATE,
  keterangan TEXT,
  stage TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_dokumen_perkara_pengaduan ON public.dokumen_perkara(pengaduan_id);

ALTER TABLE public.dokumen_perkara ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read dokumen_perkara" ON public.dokumen_perkara;
CREATE POLICY "Authenticated users can read dokumen_perkara" ON public.dokumen_perkara
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert dokumen_perkara" ON public.dokumen_perkara;
CREATE POLICY "Authenticated users can insert dokumen_perkara" ON public.dokumen_perkara
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/010_unit_tindaklanjut.sql
git commit -m "feat: migration — source fields, buku_register, dokumen_perkara"
```

---

### Task 2: Lib — roman-month.ts

**Files:**
- Create: `src/lib/roman-month.ts`

**Interfaces:**
- Produces: `export const ROMAN: Record<number, string>` (1:I..12:XII), `export function toRoman(month: number): string`, `export function getRomanMonths(): {value: number, label: string}[]`

- [ ] **Step 1: Write the file**

```typescript
export const ROMAN: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
}

export function toRoman(month: number): string {
  return ROMAN[month] ?? String(month)
}

export function getRomanMonths(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${ROMAN[i + 1]} (${new Date(2024, i, 1).toLocaleString('id', { month: 'long' })})`,
  }))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/roman-month.ts
git commit -m "feat: roman-month utility"
```

---

### Task 3: Lib — template-nomor.ts

**Files:**
- Create: `src/lib/template-nomor.ts`

**Interfaces:**
- Produces: `export const DOC_TEMPLATES: Record<string, string>`, `export function buildNomor(docType: string, nomorUrut: number | string, bulanRomawi: string, tahun: number | string, unit: string): string`

- [ ] **Step 1: Write the file**

```typescript
import { toRoman } from "./roman-month"

export const DOC_TEMPLATES: Record<string, string> = {
  lapinfo: "R/LI/{no}/{rom}/{thn}/{unit}",
  lp_a: "LP-A/{no}/{rom}/{thn}/{unit}",
  sprinlidik: "Sprinlidik/{no}/{rom}/{thn}/{unit}",
  uuk: "Ropamina/{no}/{rom}/{thn}/{unit}",
  ba_interogasi: "BA/{no}/{rom}/{thn}/{unit}",
  und_klarifikasi: "Und/{no}/{rom}/{thn}/{unit}",
  lhp: "R/LHP/{no}/{rom}/{thn}/{unit}",
  nota_dinas: "B/ND/{no}/{rom}/{thn}/{unit}",
  notulen_gelar: "Notulen/{no}/{rom}/{thn}/{unit}",
  pem_pelapor: "B/{no}/{rom}/{thn}/{unit}",
  pem_ankum: "B/{no}/{rom}/{thn}/{unit}",
}

export function buildNomor(
  docType: string,
  nomorUrut: number | string,
  bulan: number,
  tahun: number | string,
  unit: string
): string {
  const template = DOC_TEMPLATES[docType] ?? "{no}/{rom}/{thn}/{unit}"
  return template
    .replace("{no}", String(nomorUrut))
    .replace("{rom}", toRoman(bulan))
    .replace("{thn}", String(tahun))
    .replace("{unit}", unit)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/template-nomor.ts
git commit -m "feat: template-nomor utility"
```

---

### Task 4: Lib — buku-register.ts (server-side)

**Files:**
- Create: `src/lib/aksi-cards/buku-register.ts`

**Interfaces:**
- Produces: `export async function getNextRegisterNumber(unit: string, docType: string, year: number): Promise<number>`, `export async function incrementRegister(unit: string, docType: string, year: number): Promise<{nextNumber: number, lastNumber: number}>`

- [ ] **Step 1: Write the file**

```typescript
import { createServiceClient } from "@/lib/supabase/server"

export async function getNextRegisterNumber(
  unit: string,
  docType: string,
  year: number
): Promise<number> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("buku_register")
    .select("last_number")
    .eq("unit", unit)
    .eq("doc_type", docType)
    .eq("year", year)
    .maybeSingle()

  if (error || !data) return 1
  return data.last_number + 1
}

export async function incrementRegister(
  unit: string,
  docType: string,
  year: number
): Promise<{ nextNumber: number; lastNumber: number }> {
  const supabase = createServiceClient()
  const nextNumber = await getNextRegisterNumber(unit, docType, year)

  const { data: existing } = await supabase
    .from("buku_register")
    .select("id")
    .eq("unit", unit)
    .eq("doc_type", docType)
    .eq("year", year)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("buku_register")
      .update({ last_number: nextNumber, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
  } else {
    await supabase
      .from("buku_register")
      .insert({ unit, doc_type: docType, year, last_number: nextNumber })
  }

  return { nextNumber, lastNumber: nextNumber }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/aksi-cards/buku-register.ts
git commit -m "feat: buku-register server helper"
```

---

### Task 5: API — GET/POST register

**Files:**
- Create: `src/app/api/register/route.ts`

**Interfaces:**
- Consumes: `getNextRegisterNumber`, `incrementRegister` from `@/lib/aksi-cards/buku-register`
- Produces: `GET /api/register?unit=X&doc_type=Y&year=Z` → `{next_number, last_number}`, `POST /api/register` body `{unit, doc_type, year}` → `{nextNumber, lastNumber}`

- [ ] **Step 1: Write the file**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getNextRegisterNumber, incrementRegister } from "@/lib/aksi-cards/buku-register"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const unit = searchParams.get("unit")
  const docType = searchParams.get("doc_type")
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10)

  if (!unit || !docType) {
    return NextResponse.json({ success: false, error: "unit dan doc_type wajib" }, { status: 400 })
  }

  const next = await getNextRegisterNumber(unit, docType, year)
  return NextResponse.json({ success: true, next_number: next })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { unit, doc_type, year } = body

  if (!unit || !doc_type || !year) {
    return NextResponse.json({ success: false, error: "unit, doc_type, dan year wajib" }, { status: 400 })
  }

  const result = await incrementRegister(unit, doc_type, year)
  return NextResponse.json({ success: true, ...result })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/register/route.ts
git commit -m "feat: register API route (GET/POST)"
```

---

### Task 6: API — POST pengaduan/create (internal reports)

**Files:**
- Create: `src/app/api/pengaduan/create/route.ts`

**Interfaces:**
- Consumes: `incrementRegister` from `@/lib/aksi-cards/buku-register`, `createServiceClient` from `@/lib/supabase/server`, `buildNomor` from `@/lib/template-nomor`
- Produces: `POST /api/pengaduan/create` body `{source_type, source_unit, perihal, kronologi, terlapor: {...}, dokumen: [...], nomor_urut, bulan, tahun}` → `{success, id}`

- [ ] **Step 1: Write the file**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { incrementRegister } from "@/lib/aksi-cards/buku-register"
import { buildNomor } from "@/lib/template-nomor"

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const body = await request.json()
  const { source_type, source_unit, perihal, kronologi, nomor_urut, bulan, tahun, author_email, author_role } = body

  if (!source_type || !source_unit || !perihal) {
    return NextResponse.json({ success: false, error: "source_type, source_unit, dan perihal wajib" }, { status: 400 })
  }

  const docType = source_type === "lapinfo" ? "lapinfo" : "lp_a"
  const year = tahun || new Date().getFullYear()
  const month = bulan || (new Date().getMonth() + 1)

  const unitLabel = source_unit === "paminal" ? "Subbid Paminal"
    : source_unit === "provos" ? "Subbid Provos"
    : source_unit === "wabprof" ? "Subbid Wabprof"
    : source_unit

  // Auto-increment register for the report number
  let nomorUrut = nomor_urut
  if (!nomorUrut) {
    const { nextNumber } = await incrementRegister(unitLabel, docType, year)
    nomorUrut = nextNumber
  }

  const nomorLengkap = buildNomor(docType, nomorUrut, month, year, unitLabel)
  const id = crypto.randomUUID()

  // Insert as pengaduan with internal source
  const { error } = await supabase.from("pengaduan").insert({
    id,
    prepetrator_id: id,
    source: "internal",
    source_type,
    source_unit,
    summary: perihal,
    content: kronologi,
    status_label: "Menunggu Disposisi Kabid",
    case_position: "KABID PROPAM POLDA JAWA BARAT",
    polda_code: 6013,
    created_date: new Date().toISOString(),
    synced_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Save nomor laporan as a dokumen
  await supabase.from("dokumen_perkara").insert({
    pengaduan_id: id,
    doc_type: docType,
    nomor: nomorLengkap,
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: `Laporan ${source_type === "lapinfo" ? "Informasi" : "Model A"} - ${perihal}`,
    created_by: author_email || "system",
  })

  // Save catatan kronologi
  if (kronologi?.trim()) {
    await supabase.from("catatan").insert({
      pengaduan_id: id,
      prepetrator_id: id,
      author_email: author_email || "system@propam.polri.go.id",
      author_role: author_role || source_unit,
      content: `[Laporan Dibuat]\nNomor: ${nomorLengkap}\nPerihal: ${perihal}\n\n${kronologi}`,
    })
  }

  return NextResponse.json({ success: true, id, nomor: nomorLengkap })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pengaduan/create/route.ts
git commit -m "feat: API buat laporan internal (Lapinfo/LP-A)"
```

---

### Task 7: Extend API unit route for paminal stages

**Files:**
- Modify: `src/app/api/unit/route.ts`

**Interfaces:**
- Consumes: `incrementRegister` from `@/lib/aksi-cards/buku-register`, `buildNomor` from `@/lib/template-nomor`
- Produces: New `case "update_stage"` and `case "pelaporan"` in POST handler

- [ ] **Step 1: Read existing file, then add new cases**

Add imports at top (after existing imports):
```typescript
import { incrementRegister } from "@/lib/aksi-cards/buku-register"
import { buildNomor } from "@/lib/template-nomor"
```

Add new cases before the `default` case (after `case "selesai"`):
```typescript
      case "update_stage": {
        const { stage, catatan, dokumen } = body

        const gajamadaStatus = stage === "perencanaan" ? "Perencanaan Lidik"
          : stage === "pengumpulan" ? "Pengumpulan Baket"
          : stage === "pengolahan" ? "Pengolahan Baket"
          : stage === "pelaporan" ? "Pelaporan"
          : "Proses Lidik"

        await callGajamada({
          report_id: prepetratorId,
          note: `PAMINAL STAGE: ${stage} — ${catatan || "Update progress"}`,
          createdBy: "E-PROPAM Paminal",
          case_handover: "",
          status: gajamadaStatus,
          case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
        })

        const updates: Record<string, any> = {
          unit_status: "dalam_proses",
          unit_progress: catatan || `Stage: ${stage}`,
          case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }

        const { error } = await supabase.from("pengaduan").update(updates).eq("id", pengaduanId)
        if (error) throw error

        // Save documents if provided
        if (dokumen && Array.isArray(dokumen)) {
          const unitLabel = "Subbid Paminal"
          const now = new Date()
          const year = now.getFullYear()

          for (const doc of dokumen) {
            if (!doc.doc_type) continue
            const { nextNumber } = await incrementRegister(unitLabel, doc.doc_type, year)
            const nomor = doc.nomor ?? buildNomor(doc.doc_type, nextNumber, doc.bulan || (now.getMonth() + 1), doc.tahun || year, unitLabel)
            await supabase.from("dokumen_perkara").insert({
              pengaduan_id: pengaduanId,
              doc_type: doc.doc_type,
              nomor,
              tanggal: doc.tanggal ?? now.toISOString().split("T")[0],
              keterangan: doc.keterangan ?? "",
              stage,
              created_by: "system",
            })
          }
        }

        // Save catatan
        if (catatan?.trim()) {
          await supabase.from("catatan").insert({
            pengaduan_id: pengaduanId,
            prepetrator_id: prepetratorId,
            author_email: "system@propam.polri.go.id",
            author_role: "paminal",
            content: `[Stage: ${stage}] ${catatan}`,
          })
        }

        return NextResponse.json({ success: true, message: `Stage ${stage} dicatat` })
      }

      case "pelaporan": {
        const { hasil, terbukti, pelimpahan, catatan, tindak_lanjut, dokumen } = body

        if (!hasil) {
          return NextResponse.json({ success: false, error: "Hasil wajib dipilih" }, { status: 400 })
        }

        const gajamadaStatus = terbukti ? "Laporan Selesai" : "Tidak Terbukti"

        await callGajamada({
          report_id: prepetratorId,
          note: `PAMINAL PELAPORAN — Hasil: ${hasil} — ${catatan || ""}`,
          createdBy: "E-PROPAM Paminal",
          case_handover: "",
          status: gajamadaStatus,
          case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
        })

        const updates: Record<string, any> = {
          unit_status: "selesai",
          unit_completed_at: new Date().toISOString(),
          unit_progress: `Hasil: ${hasil}${pelimpahan ? ` | Limpah ke: ${pelimpahan}` : ""}`,
          case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }

        const { error } = await supabase.from("pengaduan").update(updates).eq("id", pengaduanId)
        if (error) throw error

        // Save dokumen
        if (dokumen && Array.isArray(dokumen)) {
          const unitLabel = "Subbid Paminal"
          const now = new Date()
          const year = now.getFullYear()

          for (const doc of dokumen) {
            if (!doc.doc_type) continue
            const { nextNumber } = await incrementRegister(unitLabel, doc.doc_type, year)
            const nomor = doc.nomor ?? buildNomor(doc.doc_type, nextNumber, doc.bulan || (now.getMonth() + 1), doc.tahun || year, unitLabel)
            await supabase.from("dokumen_perkara").insert({
              pengaduan_id: pengaduanId,
              doc_type: doc.doc_type,
              nomor,
              tanggal: doc.tanggal ?? now.toISOString().split("T")[0],
              keterangan: doc.keterangan ?? "",
              stage: "pelaporan",
              created_by: "system",
            })
          }
        }

        // Save tindak lanjut as catatan
        const tlLines: string[] = []
        if (tindak_lanjut && Array.isArray(tindak_lanjut)) {
          for (const tl of tindak_lanjut) {
            if (tl.checked) {
              tlLines.push(`${tl.label}: ${tl.nomor || "-"}`)
            }
          }
        }

        const catatanContent = [
          `[PELAPORAN] Hasil: ${hasil}`,
          terbukti && pelimpahan ? `Pelimpahan: ${pelimpahan}` : "",
          catatan ? `Catatan: ${catatan}` : "",
          tlLines.length > 0 ? `Tindak Lanjut:\n${tlLines.join("\n")}` : "",
        ].filter(Boolean).join("\n")

        if (catatanContent.trim()) {
          await supabase.from("catatan").insert({
            pengaduan_id: pengaduanId,
            prepetrator_id: prepetratorId,
            author_email: "system@propam.polri.go.id",
            author_role: "paminal",
            content: catatanContent,
          })
        }

        return NextResponse.json({ success: true, message: "Pelaporan selesai" })
      }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/unit/route.ts
git commit -m "feat: extend unit API for paminal stage updates and pelaporan"
```

---

### Task 8: Component — doc-template-input.tsx (reusable)

**Files:**
- Create: `src/components/pengaduan/doc-template-input.tsx`

**Interfaces:**
- Consumes: `DOC_TEMPLATES` from `@/lib/template-nomor`, `getRomanMonths` from `@/lib/roman-month`
- Produces: `export default function DocTemplateInput({ docTypes, unit, onAdd, className }: Props)` — renders a single row: dropdown doc type + input nomor + dropdown bulan + input tahun + preview + remove button

- [ ] **Step 1: Write the component**

```typescript
"use client"

import { useState, useEffect } from "react"
import { X, Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DOC_TEMPLATES, buildNomor } from "@/lib/template-nomor"
import { getRomanMonths } from "@/lib/roman-month"

export interface DocEntry {
  key: string
  doc_type: string
  nomor_urut: string
  bulan: number
  tahun: number
}

const romanMonths = getRomanMonths()
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

interface Props {
  docTypes: { value: string; label: string }[]
  unit: string
  entry: DocEntry
  onChange: (entry: DocEntry) => void
  onRemove: () => void
  showRemove: boolean
  className?: string
}

export default function DocTemplateInput({
  docTypes,
  unit,
  entry,
  onChange,
  onRemove,
  showRemove,
  className = "",
}: Props) {
  const preview = entry.doc_type
    ? buildNomor(entry.doc_type, entry.nomor_urut || "__", entry.bulan, entry.tahun, unit)
    : ""

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Select value={entry.doc_type} onValueChange={(v) => onChange({ ...entry, doc_type: v })}>
        <SelectTrigger className="w-[120px] text-xs bg-[#1E293B] border-gray-600 text-gray-200 h-7">
          <SelectValue placeholder="Jenis..." />
        </SelectTrigger>
        <SelectContent>
          {docTypes.map(d => (
            <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        type="text"
        value={entry.nomor_urut}
        onChange={(e) => onChange({ ...entry, nomor_urut: e.target.value })}
        placeholder="No"
        className="w-12 text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7 placeholder:text-gray-500"
      />
      <Select value={String(entry.bulan)} onValueChange={(v) => onChange({ ...entry, bulan: parseInt(v) })}>
        <SelectTrigger className="w-[60px] text-xs bg-[#1E293B] border-gray-600 text-gray-200 h-7">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {romanMonths.map(m => (
            <SelectItem key={m.value} value={String(m.value)} className="text-xs">{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(entry.tahun)} onValueChange={(v) => onChange({ ...entry, tahun: parseInt(v) })}>
        <SelectTrigger className="w-[68px] text-xs bg-[#1E293B] border-gray-600 text-gray-200 h-7">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {preview && (
        <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{preview}</span>
      )}
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-500 hover:text-red-400 p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export interface DocEntryList {
  entries: DocEntry[]
  onChange: (entries: DocEntry[]) => void
  docTypes: { value: string; label: string }[]
  unit: string
}

export function DocEntryList({ entries, onChange, docTypes, unit }: DocEntryList) {
  function updateEntry(idx: number, updated: DocEntry) {
    const next = [...entries]
    next[idx] = updated
    onChange(next)
  }

  function removeEntry(idx: number) {
    onChange(entries.filter((_, i) => i !== idx))
  }

  function addEntry() {
    onChange([...entries, { key: crypto.randomUUID(), doc_type: "", nomor_urut: "", bulan: new Date().getMonth() + 1, tahun: currentYear }])
  }

  return (
    <div className="space-y-1">
      {entries.map((entry, idx) => (
        <DocTemplateInput
          key={entry.key}
          docTypes={docTypes}
          unit={unit}
          entry={entry}
          onChange={(e) => updateEntry(idx, e)}
          onRemove={() => removeEntry(idx)}
          showRemove={entries.length > 1}
        />
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
      >
        <Plus className="w-3 h-3" /> Tambah Dokumen
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pengaduan/doc-template-input.tsx
git commit -m "feat: reusable DocTemplateInput component"
```

---

### Task 9: Card — aksi-buat-laporan.tsx

**Files:**
- Create: `src/components/pengaduan/aksi-buat-laporan.tsx`

**Interfaces:**
- Consumes: `AksiCard` from `./aksi-card`, `DocEntryList`, `DocEntry` from `./doc-template-input`, `DOC_TEMPLATES` from `@/lib/template-nomor`
- Produces: Card form for creating Lapinfo/LP-A, displayed on unit dashboard

- [ ] **Step 1: Write the component**

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, FilePlus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getRomanMonths } from "@/lib/roman-month"
import { DOC_TEMPLATES } from "@/lib/template-nomor"
import AksiCard from "./aksi-card"
import { DocEntryList, type DocEntry } from "./doc-template-input"

const romanMonths = getRomanMonths()
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

const REPORT_DOC_TYPES = [
  { value: "surat_pengantar", label: "Surat Pengantar" },
  { value: "kronologi", label: "Kronologi" },
  { value: "identitas", label: "Identitas Terlapor" },
  { value: "bukti", label: "Bukti Pendukung" },
]

interface Props {
  role: string
}

export default function AksiBuatLaporan({ role }: Props) {
  const isPaminal = role === "paminal"
  const defaultType = isPaminal ? "lapinfo" : "lp_a"

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [sourceType, setSourceType] = useState(defaultType)
  const [perihal, setPerihal] = useState("")
  const [kronologi, setKronologi] = useState("")
  const [namaTerlapor, setNamaTerlapor] = useState("")
  const [nrpTerlapor, setNrpTerlapor] = useState("")
  const [jabatanTerlapor, setJabatanTerlapor] = useState("")
  const [kesatuanTerlapor, setKesatuanTerlapor] = useState("")
  const [nomorUrut, setNomorUrut] = useState("")
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(currentYear)
  const [docEntries, setDocEntries] = useState<DocEntry[]>([
    { key: crypto.randomUUID(), doc_type: "", nomor_urut: "", bulan: new Date().getMonth() + 1, tahun: currentYear },
  ])

  const router = useRouter()

  async function handleSubmit() {
    if (!perihal.trim()) { setError("Perihal wajib diisi"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/pengaduan/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: sourceType,
          source_unit: role,
          perihal,
          kronologi,
          nomor_urut: nomorUrut || undefined,
          bulan,
          tahun,
          author_email: `${role}@propam.polri.go.id`,
          author_role: role,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(`Laporan berhasil dibuat. Nomor: ${json.nomor}`)
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded flex items-center justify-center gap-1"
      >
        <FilePlus className="w-3 h-3" /> Buat Laporan Baru
      </button>
    )
  }

  const unitLabel = role === "paminal" ? "Subbid Paminal"
    : role === "provos" ? "Subbid Provos"
    : role === "wabprof" ? "Subbid Wabprof"
    : role

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20">
      <div className="bg-[#0F172A] border border-gray-700 rounded-lg w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Buat Laporan Baru</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-lg">&times;</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Jenis Laporan</p>
            <Select value={sourceType} onValueChange={(v) => setSourceType(v)}>
              <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isPaminal && <SelectItem value="lapinfo">Laporan Informasi (Paminal)</SelectItem>}
                <SelectItem value="lp_a">LP Model A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Perihal</p>
            <input
              type="text"
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-2 h-8 placeholder:text-gray-500"
              placeholder="Perihal laporan..."
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Kronologi</p>
            <Textarea
              value={kronologi}
              onChange={(e) => setKronologi(e.target.value)}
              className="min-h-[80px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
              placeholder="Uraian kronologi kejadian..."
            />
          </div>

          <fieldset className="border border-gray-600 rounded p-2">
            <legend className="text-xs font-semibold text-gray-400 px-1">Terlapor</legend>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-gray-500">Nama</p>
                <input type="text" value={namaTerlapor} onChange={(e) => setNamaTerlapor(e.target.value)}
                  className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">NRP</p>
                <input type="text" value={nrpTerlapor} onChange={(e) => setNrpTerlapor(e.target.value)}
                  className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Jabatan</p>
                <input type="text" value={jabatanTerlapor} onChange={(e) => setJabatanTerlapor(e.target.value)}
                  className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Kesatuan</p>
                <input type="text" value={kesatuanTerlapor} onChange={(e) => setKesatuanTerlapor(e.target.value)}
                  className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
              </div>
            </div>
          </fieldset>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Dokumen Pendukung</p>
            <DocEntryList
              entries={docEntries}
              onChange={setDocEntries}
              docTypes={REPORT_DOC_TYPES}
              unit={unitLabel}
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : null}
            Simpan & Kirim ke Kabid
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pengaduan/aksi-buat-laporan.tsx
git commit -m "feat: Card Buat Laporan (Lapinfo/LP-A)"
```

---

### Task 10: Card — aksi-paminal.tsx (4-stage proses)

**Files:**
- Create: `src/components/pengaduan/aksi-paminal.tsx`

**Interfaces:**
- Consumes: `AksiCard` from `./aksi-card`, `DocEntryList`, `DocEntry` from `./doc-template-input`, `AksiCardRenderProps` from `@/lib/aksi-cards/types`
- Produces: 4-stage process card for Paminal

- [ ] **Step 1: Write the component**

```typescript
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Play, Send, CheckCircle2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocEntryList, type DocEntry } from "./doc-template-input"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"

const STAGES = [
  { value: "perencanaan", label: "Perencanaan" },
  { value: "pengumpulan", label: "Pengumpulan Baket" },
  { value: "pengolahan", label: "Pengolahan" },
  { value: "pelaporan", label: "Pelaporan" },
]

const STAGE_DOC_TYPES: Record<string, { value: string; label: string }[]> = {
  perencanaan: [
    { value: "sprinlidik", label: "Sprinlidik" },
    { value: "uuk", label: "UUK" },
  ],
  pengumpulan: [
    { value: "ba_interogasi", label: "BA Interogasi" },
    { value: "und_klarifikasi", label: "Und. Klarifikasi" },
  ],
  pengolahan: [
    { value: "notulen_gelar", label: "Notulen Gelar" },
  ],
  pelaporan: [
    { value: "lhp", label: "LHP" },
    { value: "nota_dinas", label: "Nota Dinas" },
  ],
}

const TINDAK_LANJUT = [
  { key: "pem_pelapor", label: "Pemberitahuan ke Pelapor" },
  { key: "pem_ankum", label: "Pemberitahuan ke Ankum" },
]

export default function AksiPaminal({
  pengaduanId,
  prepetratorId,
  pengaduan,
  config,
}: AksiCardRenderProps) {
  const unitStatus = pengaduan.unit_status
  const currentPosition = pengaduan.case_position
  const isDone = unitStatus === "selesai"

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [stage, setStage] = useState("perencanaan")
  const [catatan, setCatatan] = useState("")
  const [docEntries, setDocEntries] = useState<DocEntry[]>([
    { key: crypto.randomUUID(), doc_type: "", nomor_urut: "", bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() },
  ])

  // Pelaporan fields
  const [hasil, setHasil] = useState("")
  const [pelimpahan, setPelimpahan] = useState("")
  const [tlList, setTlList] = useState<{ key: string; label: string; checked: boolean; nomor: string }[]>(
    TINDAK_LANJUT.map(tl => ({ ...tl, checked: false, nomor: "" }))
  )

  const router = useRouter()

  const title = (config?.title as string) ?? "Proses Paminal"
  const docTypes = STAGE_DOC_TYPES[stage] ?? []

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

  async function handleStageUpdate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: stage === "pelaporan" ? "pelaporan" : "update_stage",
          pengaduanId,
          prepetratorId,
          currentPosition: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          stage,
          catatan,
          dokumen: docEntries.filter(d => d.doc_type),
          hasil: stage === "pelaporan" ? hasil : undefined,
          terbukti: stage === "pelaporan" ? hasil === "terbukti" : undefined,
          pelimpahan: stage === "pelaporan" && hasil === "terbukti" ? pelimpahan : undefined,
          tindak_lanjut: stage === "pelaporan" ? tlList : undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      setCatatan("")
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleMulai() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mulai",
          pengaduanId,
          prepetratorId,
          currentPosition: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AksiCard title={title} variant="default">
      <div className="space-y-3">
        {!unitStatus && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Mulai proses penyelidikan Paminal.</p>
            {error && <p className="text-red-400 text-xs mb-1">{error}</p>}
            {success && <p className="text-green-400 text-xs mb-1">{success}</p>}
            <button
              onClick={handleMulai}
              disabled={loading}
              className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <Play className="w-3 h-3 mr-1 inline" />}
              Mulai Proses
            </button>
          </div>
        )}

        {unitStatus === "dalam_proses" && !isDone && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Tahap</p>
              <Select value={stage} onValueChange={(v) => setStage(v ?? "perencanaan")}>
                <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Catatan Progress</p>
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tulis catatan progress..."
                className="min-h-[60px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Dokumen</p>
              <DocEntryList
                entries={docEntries}
                onChange={setDocEntries}
                docTypes={docTypes}
                unit="Subbid Paminal"
              />
            </div>

            {stage === "pelaporan" && (
              <div className="space-y-2 border-t border-gray-600 pt-2">
                <div>
                  <p className="text-xs font-semibold text-green-400 mb-1">Hasil Akhir</p>
                  <Select value={hasil} onValueChange={(v) => { setHasil(v ?? ""); if (v !== "terbukti") setPelimpahan("") }}>
                    <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                      <SelectValue placeholder="Pilih hasil..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
                      <SelectItem value="terbukti">Terbukti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-1">Tindak Lanjut Wajib</p>
                  {tlList.map((tl, idx) => (
                    <div key={tl.key} className="flex items-center gap-2 mb-1">
                      <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tl.checked}
                          onChange={() => toggleTl(idx)}
                          className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]"
                        />
                        {tl.label}
                      </label>
                      {tl.checked && (
                        <input
                          type="text"
                          value={tl.nomor}
                          onChange={(e) => setTlNomor(idx, e.target.value)}
                          placeholder="No"
                          className="w-16 text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1 h-6"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {hasil === "terbukti" && (
                  <div>
                    <p className="text-xs font-semibold text-yellow-400 mb-1">Pelimpahan ke</p>
                    <Select value={pelimpahan} onValueChange={(v) => setPelimpahan(v ?? "")}>
                      <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                        <SelectValue placeholder="Pilih unit tujuan..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="provos">Subbid Provos</SelectItem>
                        <SelectItem value="wabprof">Subbid Wabprof</SelectItem>
                        <SelectItem value="polres">Polres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}
            {success && <p className="text-green-400 text-xs">{success}</p>}

            <button
              onClick={handleStageUpdate}
              disabled={loading}
              className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <Send className="w-3 h-3 mr-1 inline" />}
              {stage === "pelaporan" ? "Selesai & Kirim" : "Update Progress"}
            </button>
          </div>
        )}

        {isDone && (
          <div className="space-y-2">
            <p className="text-xs text-green-400 text-center">Proses sudah selesai</p>
            {pengaduan.unit_progress && (
              <p className="text-xs text-gray-400 text-center">{pengaduan.unit_progress}</p>
            )}
          </div>
        )}
      </div>
    </AksiCard>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pengaduan/aksi-paminal.tsx
git commit -m "feat: Card Proses 4-Stage Paminal"
```

---

### Task 11: Update presets, registry, types

**Files:**
- Modify: `src/lib/aksi-cards/presets.ts` — add `PAMINAL_STAGES`, `TINDAK_LANJUT_OPTIONS`
- Modify: `src/lib/aksi-cards/registry.ts` — update `proses-paminal` to use new component
- Modify: `src/lib/aksi-cards/types.ts` — no changes needed (AksiCardRenderProps already sufficient)

**Interfaces:**
- Consumes: `AksiPaminal` from `@/components/pengaduan/aksi-paminal`
- Produces: Updated registry entry for `proses-paminal`

- [ ] **Step 1: Update presets.ts — add PAMINAL_STAGES export**

Add after existing `STATUS_OPTIONS`:
```typescript
export const PAMINAL_STAGES = [
  { value: "perencanaan", label: "Perencanaan" },
  { value: "pengumpulan", label: "Pengumpulan Baket" },
  { value: "pengolahan", label: "Pengolahan" },
  { value: "pelaporan", label: "Pelaporan" },
]
```

- [ ] **Step 2: Update registry.ts**

Change the import line (add AksiPaminal):
```typescript
import AksiPaminal from "@/components/pengaduan/aksi-paminal"
```

Update `proses-paminal` entry:
```typescript
  "proses-paminal": {
    component: AksiPaminal,
    defaultTitle: "Proses Paminal",
    defaultVariant: "default",
    defaultOrder: 5,
    roles: ["admin", "paminal"],
    requiredConfig: [],
  },
```

- [ ] **Step 3: Add proses-paminal to excludeSelf for paminal**

In `aksi-card-renderer.tsx`, the existing `ROLE_SELF_EXCLUDE` already excludes `KASUBBID PAMINAL/i` for `paminal` — this is correct.

- [ ] **Step 4: Commit**

```bash
git add src/lib/aksi-cards/presets.ts src/lib/aksi-cards/registry.ts
git commit -m "feat: register AksiPaminal in card registry"
```

---

### Task 12: Add "Buat Laporan" button to unit dashboard

**Files:**
- Modify: `src/app/dashboard/unit/page.tsx`
- Modify: `src/components/dashboard/unit-dashboard-client.tsx`

**Interfaces:**
- Consumes: `AksiBuatLaporan` from `@/components/pengaduan/aksi-buat-laporan`
- Produces: `Buat Laporan` button visible on unit dashboard

- [ ] **Step 1: Read unit-dashboard-client.tsx to understand props and layout**

- [ ] **Step 2: Update unit-dashboard-client.tsx**

Add after existing header section, sending role to child component. The UnitDashboardClient needs to accept `role` as a prop and render the `AksiBuatLaporan` component.

Add import at top:
```typescript
import AksiBuatLaporan from "@/components/pengaduan/aksi-buat-laporan"
```

Update the component to accept and render the role-based button. Locate the title/header section and add the button next to it:
```tsx
// In the header area:
<AksiBuatLaporan role={role} />
```

Update Props interface to include `role: string`.

- [ ] **Step 3: Update unit/page.tsx**

Pass `role` prop to `UnitDashboardClient`:
```tsx
<UnitDashboardClient
  data={list}
  unitOptions={unitOptions}
  title={title}
  role={role}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/unit/page.tsx src/components/dashboard/unit-dashboard-client.tsx
git commit -m "feat: add Buat Laporan button to unit dashboard"
```

---

### Task 13: Integration verify — run dev server and test

**Files:**
- Verify: all created/modified files

- [ ] **Step 1: Run dev server**
```bash
npm run dev
```
Expected: Server starts without errors on http://localhost:3000

- [ ] **Step 2: Check unit dashboard loads**
Navigate to http://localhost:3000/dashboard/unit
Expected: "Buat Laporan Baru" button visible for paminal/provos/wabprof roles

- [ ] **Step 3: Check pengaduan detail loads with new card**
Navigate to any pengaduan detail page for paminal role
Expected: "Proses Paminal" card visible in right column

- [ ] **Step 4: Commit final verification**

```bash
git add -A
git commit -m "chore: integration verify — all unit cards load correctly"
```

---

## Post-Implementation

After all tasks complete, update brain roadmap:
```bash
node .opencode/skills/brain-page/bin/brain.mjs read-root roadmap
# Add "Card Buat Laporan + Proses 4-Stage Paminal" to done items
```
