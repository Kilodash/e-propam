"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"
import { createClient } from "@/lib/supabase/client"
import RekapTab from "./paminal/rekap-tab"
import { DocBlock as DocBlockComp } from "./paminal/doc-block"
import {
  PelanggarItem, CatalogOptions, TindakLanjutItem,
  emptyBlock, TINDAK_LANJUT,
} from "./paminal/paminal-shared"
import type { DocBlock } from "./paminal/paminal-shared"

const DocBlock = DocBlockComp

export default function AksiProvos({ pengaduanId, prepetratorId, pengaduan, config }: AksiCardRenderProps) {
  const unitStatus = pengaduan.unit_status
  const currentPosition = pengaduan.case_position
  const isDone = unitStatus === "pelaporan_selesai" || unitStatus === "selesai"
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updateGajamada, setUpdateGajamada] = useState(true)
  const [activeTab, setActiveTab] = useState(isDone ? "rekap" : "pemeriksaan")
  const [hasil, setHasil] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const [catalogPasal, setCatalogPasal] = useState<CatalogOptions[]>([])
  const [catalogWujud, setCatalogWujud] = useState<CatalogOptions[]>([])
  const [catalogUnit, setCatalogUnit] = useState<{ value: string; label: string }[]>([])
  const [catalogPangkat, setCatalogPangkat] = useState<string[]>([])

  // Provos-specific doc blocks
  const [sprinProvos, setSprinProvos] = useState<DocBlock>(emptyBlock())
  const [dp3d, setDp3d] = useState<DocBlock>(emptyBlock())
  const [bap, setBap] = useState<DocBlock>(emptyBlock())
  const [sprinSidang, setSprinSidang] = useState<DocBlock>(emptyBlock())
  const [notulenSidang, setNotulenSidang] = useState<DocBlock>(emptyBlock())
  const [putusanDoc, setPutusanDoc] = useState<DocBlock>(emptyBlock())
  const [sprinHenti, setSprinHenti] = useState<DocBlock>(emptyBlock())
  const [pemAnkum, setPemAnkum] = useState<DocBlock>(emptyBlock())

  const [tlDocBlocks, setTlDocBlocks] = useState<Record<string, DocBlock>>({})
  const [dokumenList, setDokumenList] = useState<{ doc_type: string; nomor: string; tanggal: string }[]>([])

  const [pelanggarList, setPelanggarList] = useState<PelanggarItem[]>([])
  const [tlList, setTlList] = useState<TindakLanjutItem[]>(TINDAK_LANJUT.map(t => ({ ...t })))

  const PROVOS_STAGES = [
    { value: "pemeriksaan", label: "Pemeriksaan Pendahuluan" },
    { value: "sidang", label: "Sidang Disiplin" },
    { value: "putusan", label: "Putusan" },
  ]

  const PROVOS_HASIL = ["Sanksi Ringan", "Sanksi Sedang", "Sanksi Berat", "Tidak Terbukti"]

  const stage = activeTab === "pemeriksaan" ? "pemeriksaan"
    : activeTab === "sidang" ? "sidang"
    : "putusan"

  const TABS = [
    { key: "pemeriksaan" as const, label: "Pemeriksaan" },
    { key: "sidang" as const, label: "Sidang" },
    { key: "putusan" as const, label: "Putusan" },
    { key: "tindak_lanjut" as const, label: "Tindak Lanjut" },
    { key: "rekap" as const, label: "Rekap" },
  ]

  useEffect(() => {
    fetch("/api/catalog").then(r => r.json()).then(j => {
      setCatalogPasal(j.data?.pasal ?? [])
      setCatalogWujud(j.data?.wujud ?? [])
      setCatalogPangkat(j.data?.pangkat?.map((f: any) => f.value) ?? [])
    }).catch(() => {})
    fetch("/api/units").then(r => r.json()).then(j => {
      const raw = (j.data ?? []) as any[]
      const seen = new Set<string>()
      const options: { value: string; label: string }[] = []
      for (const u of raw) {
        const label = u.normalized_name || u.gajamada_name
        if (!seen.has(label)) {
          seen.add(label)
          options.push({ value: u.gajamada_name, label })
        }
      }
      setCatalogUnit(options)
    }).catch(() => {})
    fetch("/api/admin/settings").then(r => r.json()).then(j => {
      const row = (j.data ?? []).find((r: any) => r.key === "doc_templates")
      if (row?.value) try { setCustomTemplates(row.value as Record<string, string>) } catch {}
    }).catch(() => {})
    ;(async () => {
      // Fetch dokumen_perkara
      try {
        const supabase = createClient()
        const { data: docs } = await supabase.from("dokumen_perkara").select("doc_type, nomor, tanggal").eq("pengaduan_id", pengaduanId).order("created_at", { ascending: true })
        if (docs) setDokumenList(docs as { doc_type: string; nomor: string; tanggal: string }[])
      } catch {}
    })()
    ;(async () => {
      try {
        const gjRes = await fetch(`/api/pelanggar?prepetrator_id=${encodeURIComponent(prepetratorId)}`)
        const gjJson = await gjRes.json()
        if (gjJson.success && gjJson.data) {
          const d = gjJson.data
          // Parse birth_date: Unix timestamp ms
          const bd = d.birth_date ? new Date(Number(d.birth_date)).toISOString().split("T")[0] : ""
          // Parse articles (already an array)
          let pasalD: string[] = []
          let pasalK: string[] = []
          const articles = Array.isArray(d.articles) ? d.articles : []
          for (const a of articles as any[]) {
            const articleId = a.article_id || ""
            const kodePasal = a.kode_pasal || ""
            if (!articleId && !kodePasal) continue
            if (/perpol|kke|kode.etik/i.test(a.type || "")) {
              pasalK.push(kodePasal || articleId)
            } else {
              pasalD.push(kodePasal || articleId)
            }
          }
          // functional_assignment from widget = wujud/description, not police function
          setPelanggarList([{
            key: crypto.randomUUID(),
            prepetrator_id: prepetratorId,
            prepetrator_type: d.type || "",
            prepetrator_description: d.description || "",
            nama: d.name || "",
            pangkat: d.rank || "",
            nrp: d.identity_number || "",
            jabatan: d.position || "",
            kesatuan: d.division || "POLDA JAWA BARAT",
            functional: "",
            tempat_lahir: d.birth_place || "",
            tanggal_lahir: bd,
            telpon: d.phone_number || "",
            pendidikan: d.professional_education || "",
            graduation_year: d.graduation_year || "",
            jenis_kelamin: d.gender || "",
            wujud: d.form_of_action || "",
            kategori: d.category || "",
            sub_kategori: d.sub_category || "",
            pasal_disiplin: pasalD,
            pasal_kke: pasalK,
          }])
          return
        }
      } catch {}
      // Fallback ke pelanggar_paminal
      try {
        const supabase = createClient()
        const { data } = await supabase.from("pelanggar_paminal").select("data").eq("pengaduan_id", pengaduanId).order("created_at", { ascending: false }).limit(1).single()
        if (data?.data && Array.isArray(data.data)) setPelanggarList(data.data as PelanggarItem[])
      } catch {}
    })()
  }, [pengaduanId])

  async function handleUpdateStatus() {
    setUpdatingStatus(true)
    try {
      await fetch("/api/unit", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mulai", pengaduanId, prepetratorId, currentPosition: currentPosition || "KASUBBID PROVOS POLDA JAWA BARAT", skip_gajamada: !updateGajamada }) })
      router.refresh()
    } catch {} finally { setUpdatingStatus(false) }
  }

  function toggleTl(idx: number) { const n = [...tlList]; n[idx].checked = !n[idx].checked; setTlList(n) }
  function setTlNomor(idx: number, v: string) { const n = [...tlList]; n[idx].nomor = v; setTlList(n) }
  async function salinRekap() { const lines = tlList.filter(tl => tl.checked).map(tl => `${tl.label} — No: ${tl.nomor || "-"}`); await navigator.clipboard.writeText(lines.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  async function refreshDokumen() {
    try { const s = createClient(); const { data: docs } = await s.from("dokumen_perkara").select("doc_type,nomor,tanggal").eq("pengaduan_id", pengaduanId).order("created_at",{ascending:true}); if (docs) setDokumenList(docs as any[]) } catch {}
  }

  async function simpanDok(docType: string, block: DocBlock, setter: React.Dispatch<React.SetStateAction<DocBlock>>) {
    if (!block.tanggal || !block.nomor) return; setter(p => ({ ...p, saving: true }))
    try {
      const p = { action: "upload_only", pengaduanId, prepetratorId, dokumen: [{ doc_type: docType, nomor: block.nomor, tanggal: block.tanggal }] }
      let res; if (block.files.length > 0) { const fd = new FormData(); fd.append("data", JSON.stringify(p)); block.files.forEach(f => fd.append("files", f)); res = await fetch("/api/unit", { method:"POST", body:fd }) } else res = await fetch("/api/unit", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(p)})
      const j = await res.json(); if (!j.success) throw new Error(j.error)
      setter(pp => ({ ...pp, saving:false, saved:true, files:[], uploadedFiles:[...pp.uploadedFiles, ...(j.attachments??[]) as any[]] }))
      setTimeout(() => setter(pp => ({ ...pp, saved:false })), 2000); refreshDokumen(); router.refresh()
    } catch { setter(pp => ({ ...pp, saving:false })) }
  }

  async function handleSavePelanggar() {
    setLoading(true); setError(null)
    try { const res = await fetch("/api/unit", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"save_pelanggar", pengaduanId, prepetratorId, skip_gajamada:!updateGajamada, pelanggar_list:pelanggarList })}); const j = await res.json(); if (!j.success) throw new Error(j.error); setSuccess(j.message); router.refresh() }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  async function handleStageUpdate() {
    setLoading(true); setError(null)
    try { const res = await fetch("/api/unit", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action: stage==="putusan" ? "pelaporan" : "update_stage", pengaduanId, prepetratorId, currentPosition: currentPosition||"KASUBBID PROVOS POLDA JAWA BARAT", stage, hasil, pelanggar_list:pelanggarList, tindak_lanjut:tlList, skip_gajamada:!updateGajamada })}); const j = await res.json(); if (!j.success) throw new Error(j.error); setSuccess(j.message); router.refresh() }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  const title = (config?.title as string) ?? "Proses Provos"

  if (isDone) {
    return (
      <AksiCard title={title} variant="default">
        <RekapTab stage={stage} hasil={hasil} gelarTgl="" gelarNo="" tlList={tlList} pelanggarList={pelanggarList} pelimpahan=""
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

        {activeTab === "pemeriksaan" && (
          <div className="space-y-3">
            <DocBlock title="Sprin Pemeriksaan" docType="sprin_provos" block={sprinProvos} setter={setSprinProvos} customTemplates={customTemplates} onSimpanDok={simpanDok} />
            <hr className="border-gray-700" />
            <DocBlock title="DP3D" docType="dp3d" block={dp3d} setter={setDp3d} customTemplates={customTemplates} onSimpanDok={simpanDok} />
            <hr className="border-gray-700" />
            <DocBlock title="BAP" docType="bap" block={bap} setter={setBap} customTemplates={customTemplates} onSimpanDok={simpanDok} />
            <hr className="border-gray-700" />
            <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={updateGajamada} onChange={e => setUpdateGajamada(e.target.checked)} className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
              Update Timeline Gajamada
            </label>
            <button onClick={handleUpdateStatus} disabled={updatingStatus}
              className="w-full flex items-center justify-center gap-1 text-sm px-2 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded disabled:opacity-40">
              {updatingStatus ? "..." : ""}Mulai Pemeriksaan Provos
            </button>
          </div>
        )}

        {activeTab === "sidang" && (
          <div className="space-y-3">
            <DocBlock title="Sprin Sidang" docType="sprin_sidang" block={sprinSidang} setter={setSprinSidang} customTemplates={customTemplates} onSimpanDok={simpanDok} />
            <hr className="border-gray-700" />
            <DocBlock title="Notulen Sidang" docType="notulen_sidang" block={notulenSidang} setter={setNotulenSidang} customTemplates={customTemplates} onSimpanDok={simpanDok} />
            <hr className="border-gray-700" />
            <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={updateGajamada} onChange={e => setUpdateGajamada(e.target.checked)} className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
              Update Timeline Gajamada
            </label>
            <button onClick={handleStageUpdate} disabled={loading}
              className="w-full flex items-center justify-center gap-1 text-sm px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded disabled:opacity-40">
              Lanjut ke Putusan
            </button>
          </div>
        )}

        {activeTab === "putusan" && (
          <div className="space-y-3">
            <DocBlock title="Putusan Disiplin" docType="putusan_disiplin" block={putusanDoc} setter={setPutusanDoc} customTemplates={customTemplates} onSimpanDok={simpanDok} />
            <hr className="border-gray-700" />
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Hasil Putusan</p>
              <select value={hasil} onChange={e => setHasil(e.target.value)} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                <option value="">Pilih Hasil...</option>
                {PROVOS_HASIL.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <hr className="border-gray-700" />
            <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={updateGajamada} onChange={e => setUpdateGajamada(e.target.checked)} className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
              Update Timeline Gajamada
            </label>
            <button onClick={handleStageUpdate} disabled={loading || !hasil}
              className="w-full flex items-center justify-center gap-1 text-sm px-2 py-1.5 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-50">
              Kirim → Selesai
            </button>
          </div>
        )}

        {activeTab === "tindak_lanjut" && (
          <div className="space-y-3">
            {tlList.map((tl) => {
              const block = tlDocBlocks[tl.key] || { tanggal: "", nomor: "", files: [] as File[], uploadedFiles: [] as { url: string; file_name: string }[], saving: false, saved: false }
              return (
                <div key={tl.key}>
                  <DocBlock title={tl.label} docType={tl.key} block={block}
                    setter={(updater) => { setTlDocBlocks(prev => { const nb = typeof updater === "function" ? (updater as (p: DocBlock) => DocBlock)(prev[tl.key] || block) : updater; return { ...prev, [tl.key]: nb } }) }}
                    customTemplates={customTemplates} onSimpanDok={simpanDok} />
                  <hr className="border-gray-700" />
                </div>
              )
            })}
          </div>
        )}

        {activeTab === "rekap" && (
          <RekapTab stage={stage} hasil={hasil} gelarTgl="" gelarNo="" tlList={tlList} pelanggarList={pelanggarList} pelimpahan=""
            error={error} success={success} updateGajamada={updateGajamada} onToggleUpdate={setUpdateGajamada}
            onSubmit={handleStageUpdate} loading={loading} pengaduan={pengaduan} isDone={false} pengaduanId={pengaduanId}
            dokumenList={dokumenList} pelimpahanKe="" pelimpahanNomor="" pelimpahanTgl="" />
        )}
      </div>
    </AksiCard>
  )
}
