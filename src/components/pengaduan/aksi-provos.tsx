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
import type { DocBlock, PelanggarItem } from "./paminal/paminal-shared"
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

  // Pelanggar data
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
