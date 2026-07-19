"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"
import { createClient } from "@/lib/supabase/client"
import ProsesLidikTab from "./paminal/proses-lidik-tab"
import PelaporanTab from "./paminal/pelaporan-tab"
import PelanggarTab from "./paminal/pelanggar-tab"
import TindakLanjutTab from "./paminal/tindak-lanjut-tab"
import RekapTab from "./paminal/rekap-tab"
import {
  PelanggarItem, CatalogOptions, DocBlock, TindakLanjutItem,
  emptyBlock, BASE_TABS, TINDAK_LANJUT, PELIMPAHAN_TARGETS,
} from "./paminal/paminal-shared"

export default function AksiPaminal({ pengaduanId, prepetratorId, pengaduan, config }: AksiCardRenderProps) {
  const unitStatus = pengaduan.unit_status
  const currentPosition = pengaduan.case_position
  const isDone = unitStatus === "pelaporan_selesai" || unitStatus === "selesai"
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updateGajamada, setUpdateGajamada] = useState(true)
  const [activeTab, setActiveTab] = useState(isDone ? "rekap" : "proses_lidik")
  const [hasil, setHasil] = useState("")
  const [pelimpahan, setPelimpahan] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const [catalogPasal, setCatalogPasal] = useState<CatalogOptions[]>([])
  const [catalogWujud, setCatalogWujud] = useState<CatalogOptions[]>([])
  const [catalogUnit, setCatalogUnit] = useState<{ value: string; label: string }[]>([])
  const [catalogFunctional, setCatalogFunctional] = useState<string[]>([])
  const [catalogPangkat, setCatalogPangkat] = useState<string[]>([])

  const [pemberitahuanAwal, setPemberitahuanAwal] = useState<DocBlock>(emptyBlock())
  const [uuk, setUuk] = useState<DocBlock>(emptyBlock())
  const [sprin, setSprin] = useState<DocBlock>(emptyBlock())
  const [gelarBlock, setGelarBlock] = useState<DocBlock>(emptyBlock())
  const [lhp, setLhp] = useState<DocBlock>(emptyBlock())
  const [nodin, setNodin] = useState<DocBlock>(emptyBlock())
  const [sprinHenti, setSprinHenti] = useState<DocBlock>(emptyBlock())
  const [pemAnkum, setPemAnkum] = useState<DocBlock>(emptyBlock())
  const [suratMabes, setSuratMabes] = useState<DocBlock>(emptyBlock())
  const [strJukrah, setStrJukrah] = useState<DocBlock>(emptyBlock())
  const [showSuratMabes, setShowSuratMabes] = useState(false)
  const [showStrJukrah, setShowStrJukrah] = useState(false)

  const [pelanggarList, setPelanggarList] = useState<PelanggarItem[]>([])
  const [tlList, setTlList] = useState<TindakLanjutItem[]>(TINDAK_LANJUT.map(t => ({ ...t })))

  const [perdamaianMateriil, setPerdamaianMateriil] = useState<Record<string, boolean>>({})
  const [perdamaianPembatas, setPerdamaianPembatas] = useState<Record<string, boolean>>({})
  const [perdamaianFormil, setPerdamaianFormil] = useState<Record<string, boolean>>({})

  const stage = activeTab === "pelaporan" || activeTab === "terbukti" ? "pelaporan"
    : activeTab === "tindak_lanjut" || activeTab === "rekap" ? "pelaporan"
    : "perencanaan"

  const TABS = [...BASE_TABS.slice(0, 2), { key: "terbukti" as const, label: "Pelanggar" }, ...BASE_TABS.slice(2)]

  useEffect(() => {
    fetch("/api/catalog").then(r => r.json()).then(j => {
      setCatalogPasal(j.data?.pasal ?? [])
      setCatalogWujud(j.data?.wujud ?? [])
      setCatalogUnit(j.data?.unit ?? [])
      setCatalogFunctional(j.data?.functional?.map((f: any) => f.value) ?? [])
      setCatalogPangkat(j.data?.pangkat?.map((f: any) => f.value) ?? [])
    }).catch(() => {})
    fetch("/api/admin/settings").then(r => r.json()).then(j => {
      const row = (j.data ?? []).find((r: any) => r.key === "doc_templates")
      if (row?.value) try { setCustomTemplates(row.value as Record<string, string>) } catch {}
    }).catch(() => {})
    ;(async () => {
      try {
        const gjRes = await fetch(`/api/pelanggar?prepetrator_id=${encodeURIComponent(prepetratorId)}`)
        const gjJson = await gjRes.json()
        console.log("[aksi-paminal] pelanggar keys:", Object.keys(gjJson.data || {}).join(", "))
        if (gjJson.success && gjJson.data) {
          const d = gjJson.data
          setPelanggarList([{
            key: crypto.randomUUID(),
            prepetrator_id: prepetratorId,
            prepetrator_type: d.prepetrator_type || "",
            prepetrator_description: d.prepetrator_description || "",
            nama: d.prepetrator_name || "",
            pangkat: d.prepetrator_rank || "",
            nrp: d.prepetrator_id_number || "",
            jabatan: d.prepetrator_position || "",
            kesatuan: d.prepetrator_division || "POLDA JAWA BARAT",
            functional: d.prepetrator_functional || "",
            tempat_lahir: d.prepetrator_birth_place || "",
            tanggal_lahir: d.prepetrator_birth_date || "",
            telpon: d.prepetrator_phone || "",
            pendidikan: d.prepetrator_education || "",
            graduation_year: d.prepetrator_graduation_year || "",
            jenis_kelamin: d.prepetrator_gender || "",
            wujud: d.prepetrator_form_of_action || "",
            kategori: d.prepetrator_category || "",
            sub_kategori: d.prepetrator_sub_category || "",
            pasal_disiplin: [],
            pasal_kke: [],
          }])
          setHasil("terbukti")
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
        body: JSON.stringify({ action: "mulai", pengaduanId, prepetratorId, currentPosition: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT", skip_gajamada: !updateGajamada }),
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
        body: JSON.stringify({ action: "save_pelanggar", pengaduanId, prepetratorId, skip_gajamada: !updateGajamada, pelanggar_list: pelanggarList }),
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
          skip_gajamada: !updateGajamada,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      router.refresh()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  const title = (config?.title as string) ?? "Proses Paminal"

  if (isDone) {
    return (
      <AksiCard title={title} variant="default">
        <RekapTab
          stage={stage} hasil={hasil} gelarTgl={gelarBlock.tanggal} gelarNo={gelarBlock.nomor}
          tlList={tlList} pelanggarList={pelanggarList} pelimpahan={pelimpahan}
          error={error} success={success} updateGajamada={updateGajamada}
          onToggleUpdate={setUpdateGajamada} onSubmit={async () => {}} loading={loading} pengaduan={pengaduan} isDone pengaduanId={pengaduanId}
        />
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

        {activeTab === "proses_lidik" && (
          <ProsesLidikTab
            updateGajamada={updateGajamada} onToggleUpdate={setUpdateGajamada}
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
            updateGajamada={updateGajamada} onToggleUpdate={setUpdateGajamada}
            loading={loading} pelanggarList={pelanggarList}
            onStageUpdate={handleStageUpdate}
            customTemplates={customTemplates} onSimpanDok={simpanDok}
          />
        )}

        {activeTab === "terbukti" && (
          <PelanggarTab
            pelanggarList={pelanggarList} setPelanggarList={setPelanggarList}
            catalogPasal={catalogPasal} catalogWujud={catalogWujud}
            catalogPangkat={catalogPangkat} catalogFunctional={catalogFunctional}
            loading={loading} error={error} success={success}
            onSavePelanggar={handleSavePelanggar}
            onReset={() => { if (confirm("Reset semua data terduga pelanggar?")) setPelanggarList([]) }}
            updateGajamada={updateGajamada}
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
            suratMabes={suratMabes} setSuratMabes={setSuratMabes}
            strJukrah={strJukrah} setStrJukrah={setStrJukrah}
            showSuratMabes={showSuratMabes} setShowSuratMabes={setShowSuratMabes}
            showStrJukrah={showStrJukrah} setShowStrJukrah={setShowStrJukrah}
            customTemplates={customTemplates} onSimpanDok={simpanDok}
          />
        )}

        {activeTab === "rekap" && (
          <RekapTab
            stage={stage} hasil={hasil} gelarTgl={gelarBlock.tanggal} gelarNo={gelarBlock.nomor}
            tlList={tlList} pelanggarList={pelanggarList} pelimpahan={pelimpahan}
            error={error} success={success} updateGajamada={updateGajamada}
            onToggleUpdate={setUpdateGajamada}
            onSubmit={() => handleStageUpdate(hasil)}
            loading={loading} pengaduan={pengaduan} isDone={false} pengaduanId={pengaduanId}
          />
        )}
      </div>
    </AksiCard>
  )
}
