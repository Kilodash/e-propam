"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DOC_TEMPLATES } from "@/lib/template-nomor"

interface DocItem {
  key: string
  label: string
}

interface DocGroup {
  name: string
  key: string
  color: string
  badge: string
  items: DocItem[]
}

const GROUPS: DocGroup[] = [
  {
    name: "Subbid Paminal",
    key: "paminal",
    color: "border-blue-500/40 bg-blue-950/20",
    badge: "bg-blue-900/40 text-blue-300 border-blue-600/50",
    items: [
      { key: "pemberitahuan_awal", label: "Pemberitahuan Awal" },
      { key: "uuk", label: "UUK" },
      { key: "sprinlidik", label: "Sprin Lidik" },
      { key: "notulen_gelar", label: "Notulen Gelar Paminal" },
      { key: "lhp", label: "LHP Paminal" },
      { key: "nota_dinas", label: "Nota Dinas Paminal" },
      { key: "sprin_henti", label: "Sprin Henti Lidik" },
      { key: "sp2hp2", label: "SP2HP2" },
      { key: "pem_pelapor", label: "Pemberitahuan ke Pelapor" },
      { key: "pem_ankum", label: "Pemberitahuan ke Ankum" },
      { key: "surat", label: "Surat Pelimpahan Paminal" },
      { key: "str_jukrah", label: "STR Jukrah" },
    ],
  },
  {
    name: "Subbid Provos",
    key: "provos",
    color: "border-red-500/40 bg-red-950/20",
    badge: "bg-red-900/40 text-red-300 border-red-600/50",
    items: [
      { key: "gelar_provos", label: "Gelar Perkara Provos" },
      { key: "lp_a", label: "Laporan Polisi (LP-A)" },
      { key: "sprin_riksa", label: "Sprin Riksa Provos" },
      { key: "dp3d", label: "Berkas DP3D" },
      { key: "nota_dinas_dp3d", label: "Nota Dinas Pelimpahan DP3D" },
      { key: "sprin_provos", label: "Sprin Provos" },
      { key: "bap", label: "BAP Provos" },
      { key: "sprin_sidang", label: "Sprin Sidang Disiplin" },
      { key: "notulen_sidang", label: "Notulen Sidang Disiplin" },
      { key: "putusan_disiplin", label: "Putusan Sidang Disiplin (Skep)" },
      { key: "khd", label: "KHD (Keputusan Hukuman Disiplin)" },
    ],
  },
  {
    name: "Subbid Wabprof",
    key: "wabprof",
    color: "border-yellow-500/40 bg-yellow-950/20",
    badge: "bg-yellow-900/40 text-yellow-300 border-yellow-600/50",
    items: [
      { key: "gelar_wabprof", label: "Gelar Perkara Wabprof" },
      { key: "lhp_wabprof", label: "LHP / Audit Wabprof" },
      { key: "sprin_wabprof", label: "Sprin Riksa / Audit Wabprof" },
      { key: "putusan_kkep", label: "Putusan Sidang KKEP" },
      { key: "memori_banding", label: "Memori Banding KKEP" },
    ],
  },
  {
    name: "Polres / Satker",
    key: "polres",
    color: "border-purple-500/40 bg-purple-950/20",
    badge: "bg-purple-900/40 text-purple-300 border-purple-600/50",
    items: [
      { key: "lapinfo", label: "Laporan Informasi (Lapinfo)" },
      { key: "renbut", label: "Renbut Anggaran" },
      { key: "ba_interogasi", label: "BA Interogasi" },
      { key: "und_klarifikasi", label: "Undangan Klarifikasi" },
    ],
  },
]

const PLACEHOLDERS = "{no} = nomor urut, {rom} = bulan romawi, {thn} = tahun, {unit} = nama unit"

export default function TemplateNomorPage() {
  const [templates, setTemplates] = useState<Record<string, string>>({ ...DOC_TEMPLATES })
  const [savedAll, setSavedAll] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState<string>("all")

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(json => {
        const row = (json.data ?? []).find((r: any) => r.key === "doc_templates")
        if (row?.value) {
          try {
            setTemplates(prev => ({ ...prev, ...row.value }))
          } catch {}
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function simpanSemua() {
    setSavingAll(true)
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "doc_templates", value: templates }),
    })
    setSavingAll(false)
    setSavedAll(true)
    setTimeout(() => setSavedAll(false), 2000)
  }

  function reset(docType: string) {
    setTemplates(p => ({ ...p, [docType]: DOC_TEMPLATES[docType] ?? "" }))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  const visibleGroups = activeGroup === "all" ? GROUPS : GROUPS.filter(g => g.key === activeGroup)

  return (
    <div className="max-w-3xl pb-12">
      <div className="mb-6 flex items-center justify-between sticky top-0 bg-[#0F172A] z-10 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Template Nomor Dokumen</h2>
          <p className="text-xs text-gray-500 mt-1">{PLACEHOLDERS}</p>
        </div>
        <button
          onClick={simpanSemua}
          disabled={savingAll}
          className="flex items-center gap-2 px-4 py-2 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded font-medium disabled:opacity-50"
        >
          {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {savedAll ? "Tersimpan" : "Simpan Semua"}
        </button>
      </div>

      {/* Filter Sub-Nav Group Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveGroup("all")}
          className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
            activeGroup === "all" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          }`}
        >
          Semua Fungsi
        </button>
        {GROUPS.map(g => (
          <button
            key={g.key}
            onClick={() => setActiveGroup(g.key)}
            className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
              activeGroup === g.key ? g.badge : "border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {visibleGroups.map(group => (
          <div key={group.key} className={`border rounded-xl p-4 space-y-3 ${group.color}`}>
            <div className="flex items-center justify-between border-b border-gray-700/60 pb-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${group.badge}`}>
                {group.name}
              </span>
              <span className="text-[11px] text-gray-500 font-mono">{group.items.length} jenis dokumen</span>
            </div>

            <div className="space-y-2.5">
              {group.items.map(item => (
                <div key={item.key} className="bg-[#0F172A] border border-gray-700/80 rounded-lg px-3.5 py-2.5">
                  <p className="text-xs font-semibold text-gray-200 mb-1.5 flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="text-gray-500 font-mono text-[10px]">{item.key}</span>
                  </p>
                  <div className="flex gap-2 items-center">
                    <Input
                      value={templates[item.key] ?? ""}
                      onChange={e => setTemplates(p => ({ ...p, [item.key]: e.target.value }))}
                      className="flex-1 h-8 text-xs font-mono bg-[#1E293B] border-gray-600 text-gray-200"
                      placeholder={`{no}/{rom}/{thn}/{unit}`}
                    />
                    <button
                      onClick={() => reset(item.key)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-600 text-gray-400 hover:text-white rounded"
                      title="Reset ke default"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">
                    Default: {DOC_TEMPLATES[item.key] ?? "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
