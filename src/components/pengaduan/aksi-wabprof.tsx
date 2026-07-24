"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"
import { createClient } from "@/lib/supabase/client"
import PemeriksaanAwalTab from "./provos/pemeriksaan-awal-tab"
import SidangKkepTab from "./wabprof/sidang-kkep-tab"
import RekapTab from "./paminal/rekap-tab"
import PelanggarTab from "./paminal/pelanggar-tab"
import { DocBlock as DocBlockComp } from "./paminal/doc-block"
import { emptyBlock } from "./paminal/paminal-shared"
import { emptySidangKkepEntry } from "./wabprof/wabprof-shared"
import type { DocBlock, PelanggarItem, CatalogOptions } from "./paminal/paminal-shared"
import type { SidangKkepEntry } from "./wabprof/wabprof-shared"

const TABS = [
  { key: "pemeriksaan_awal" as const, label: "Riksa Pendahuluan/Audit" },
  { key: "sidang" as const, label: "Sidang KKEP" },
  { key: "rekap" as const, label: "Rekap" },
]

export default function AksiWabprof({ pengaduanId, prepetratorId, pengaduan, config }: AksiCardRenderProps) {
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

  // Tab 1: Pemeriksaan Awal / Audit doc blocks
  const [gelarBlock, setGelarBlock] = useState<DocBlock>(emptyBlock())
  const [lpABlock, setLpABlock] = useState<DocBlock>(emptyBlock())
  const [sprinRiksaBlock, setSprinRiksaBlock] = useState<DocBlock>(emptyBlock())
  const [dp3dBlock, setDp3dBlock] = useState<DocBlock>(emptyBlock())

  // DP3D / Berkas Perkara processed flag + limpahan
  const [dp3dLimpahan, setDp3dLimpahan] = useState("")
  const [dp3dStatus, setDp3dStatus] = useState("none" as "none" | "sidang" | "limpah")
  const [showLimpahBlock, setShowLimpahBlock] = useState(false)
  const [limpahBlock, setLimpahBlock] = useState<DocBlock>(emptyBlock())

  // Tab 2: Sidang KKEP
  const [sidangList, setSidangList] = useState<SidangKkepEntry[]>([emptySidangKkepEntry()])

  // Pelanggar data + catalog
  const [pelanggarList, setPelanggarList] = useState<PelanggarItem[]>([])
  const [catalogPasal, setCatalogPasal] = useState<CatalogOptions[]>([])
  const [catalogWujud, setCatalogWujud] = useState<CatalogOptions[]>([])
  const [catalogPangkat, setCatalogPangkat] = useState<string[]>([])
  const [catalogFunctional, setCatalogFunctional] = useState<string[]>([])
  const [catalogUnit, setCatalogUnit] = useState<{ value: string; label: string }[]>([])

  // Rekap data
  const [dokumenList, setDokumenList] = useState<{ doc_type: string; nomor: string; tanggal: string }[]>([])

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(j => {
      const row = (j.data ?? []).find((r: any) => r.key === "doc_templates")
      if (row?.value) try { setCustomTemplates(row.value as Record<string, string>) } catch {}
    }).catch(() => {})
    fetch("/api/catalog").then(r => r.json()).then(j => {
      setCatalogPasal(j.data?.pasal ?? [])
      setCatalogWujud(j.data?.wujud ?? [])
      setCatalogPangkat(j.data?.pangkat?.map((f: any) => f.value) ?? [])
      setCatalogFunctional(j.data?.functional?.map((f: any) => f.value) ?? [])
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

    ;(async () => {
      try {
        const supabase = createClient()
        const { data: docs } = await supabase.from("dokumen_perkara").select("doc_type, nomor, tanggal").eq("pengaduan_id", pengaduanId).order("created_at", { ascending: true })
        if (docs) {
          setDokumenList(docs as any[])
          for (const d of docs) {
            if (!d.nomor) continue
            if (d.doc_type === "gelar_wabprof" || d.doc_type === "gelar_provos") setGelarBlock(b => ({ ...b, nomor: d.nomor, tanggal: d.tanggal || b.tanggal, saved: true }))
            else if (d.doc_type === "lhp_wabprof" || d.doc_type === "lp_a") setLpABlock(b => ({ ...b, nomor: d.nomor, tanggal: d.tanggal || b.tanggal, saved: true }))
            else if (d.doc_type === "sprin_wabprof" || d.doc_type === "sprin_riksa") setSprinRiksaBlock(b => ({ ...b, nomor: d.nomor, tanggal: d.tanggal || b.tanggal, saved: true }))
            else if (d.doc_type === "dp3d") setDp3dBlock(b => ({ ...b, nomor: d.nomor, tanggal: d.tanggal || b.tanggal, saved: true }))
            else if (d.doc_type === "nota_dinas_dp3d") setLimpahBlock(b => ({ ...b, nomor: d.nomor, tanggal: d.tanggal || b.tanggal, saved: true }))
          }
        }
      } catch {}
    })()

    ;(async () => {
      try {
        const gjRes = await fetch(`/api/pelanggar?prepetrator_id=${encodeURIComponent(prepetratorId)}`)
        const gjJson = await gjRes.json()
        if (gjJson.success && gjJson.data) {
          const d = gjJson.data
          const bd = d.birth_date ? new Date(Number(d.birth_date)).toISOString().split("T")[0] : ""
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
      try {
        const supabase = createClient()
        const { data } = await supabase.from("pelanggar_paminal").select("data").eq("pengaduan_id", pengaduanId).order("created_at", { ascending: false }).limit(1).single()
        if (data?.data && Array.isArray(data.data)) setPelanggarList(data.data as PelanggarItem[])
      } catch {}
    })()
  }, [pengaduanId, prepetratorId])

  async function refreshDokumen() {
    try {
      const s = createClient()
      const { data: docs } = await s.from("dokumen_perkara").select("doc_type, nomor, tanggal").eq("pengaduan_id", pengaduanId).order("created_at", { ascending: true })
      if (docs) setDokumenList(docs as any[])
    } catch {}
  }

  async function simpanDok(docType: string, block: DocBlock, setter: React.Dispatch<React.SetStateAction<DocBlock>>) {
    if (!block.tanggal || !block.nomor) return
    setter(pp => ({ ...pp, saving: true }))
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
      if (!j.success) {
        setter(pp => ({ ...pp, saving: false, saved: false, saveError: true }))
        throw new Error(j.error)
      }
      setter(pp => ({ ...pp, saving: false, saved: true, saveError: false, files: [], uploadedFiles: [...pp.uploadedFiles, ...(j.attachments ?? []) as any[]] }))
      refreshDokumen()
    } catch { setter(pp => ({ ...pp, saving: false, saved: false, saveError: true })) }
  }

  async function handleSaveRiksaAwal() {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "riksa_wabprof",
          pengaduanId, prepetratorId, currentPosition,
          gelar_tanggal: gelarBlock.tanggal, gelar_nomor: gelarBlock.nomor,
          lpa_tanggal: lpABlock.tanggal, lpa_nomor: lpABlock.nomor,
          sprin_riksa_tanggal: sprinRiksaBlock.tanggal, sprin_riksa_nomor: sprinRiksaBlock.nomor,
          dp3d_tanggal: dp3dBlock.tanggal, dp3d_nomor: dp3dBlock.nomor,
          skip_gajamada: !updateGajamada,
        }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      setSuccess(j.message)
      router.refresh()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  async function handleLimpahDP3D() {
    if (!dp3dLimpahan) { setError("Pilih unit / polres tujuan pelimpahan!"); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "limpahkan",
          pengaduanId, prepetratorId, currentPosition,
          target_case_position: dp3dLimpahan,
          target_status: "Pelimpahan Berkas Perkara",
          nota_dinas_nomor: limpahBlock.nomor,
          nota_dinas_tanggal: limpahBlock.tanggal,
          skip_gajamada: !updateGajamada,
        }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      setSuccess(j.message)
      router.refresh()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  async function handleSavePelanggar() {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_pelanggar", pengaduanId, prepetratorId, skip_gajamada: !updateGajamada, pelanggar_list: pelanggarList }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      setSuccess(j.message)
      router.refresh()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  async function handleSidangSave() {
    setLoading(true); setError(null)
    try {
      const mappedSidangList = sidangList.map(s => {
        const selectedPelanggar = pelanggarList.filter(p => (s.pelanggarKeys || []).includes(p.key))
        const pNames = selectedPelanggar.map(p => p.nama).filter(Boolean).join(", ")
        return {
          key: s.key,
          pelanggar_keys: s.pelanggarKeys || [],
          pelanggar_list: selectedPelanggar,
          pelanggar_nama: pNames || "-",
          tempat_sidang: s.tempatSidang || "-",
          khd_tanggal: s.khdTanggal,
          khd_nomor: s.khdNomor,
          putusan: s.putusan,
          catatan: s.catatan,
          banding: s.banding,
          banding_tanggal: s.bandingTanggal,
          banding_memo: s.bandingMemo,
        }
      })

      const res = await fetch("/api/unit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_sidang",
          pengaduanId, prepetratorId, currentPosition,
          sidang_list: mappedSidangList,
          pelanggar_list: pelanggarList,
          skip_gajamada: !updateGajamada,
        }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      setSuccess(j.message)
      router.refresh()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  async function simpanKhd(key: string) {
    const s = sidangList.find(e => e.key === key)
    if (!s || !s.khdTanggal || !s.khdNomor) return
    try {
      const body: any = {
        action: "upload_only",
        pengaduanId, prepetratorId,
        dokumen: [{ doc_type: "khd", nomor: s.khdNomor, tanggal: s.khdTanggal }],
      }
      let res
      if (s.khdFiles.length > 0) {
        const fd = new FormData(); fd.append("data", JSON.stringify(body))
        s.khdFiles.forEach(f => fd.append("files", f))
        res = await fetch("/api/unit", { method: "POST", body: fd })
      } else {
        res = await fetch("/api/unit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      }
      const j = await res.json()
      if (!j.success) {
        setSidangList(prev => prev.map(e => e.key === key ? { ...e, khdSaving: false, khdSaved: false, khdSaveError: true } : e))
        throw new Error(j.error)
      }
      setSidangList(prev => prev.map(e => e.key === key ? { ...e, khdSaving: false, khdSaved: true, khdSaveError: false, khdUploadedFiles: [...e.khdUploadedFiles, ...(j.attachments ?? []) as any[]], khdFiles: [] } : e))
      refreshDokumen()
    } catch {
      setSidangList(prev => prev.map(e => e.key === key ? { ...e, khdSaving: false, khdSaved: false, khdSaveError: true } : e))
    }
  }

  async function handleFinalize() {
    setLoading(true); setError(null)
    try {
      const mappedSidangList = sidangList.map(s => {
        const selectedPelanggar = pelanggarList.filter(p => (s.pelanggarKeys || []).includes(p.key))
        const pNames = selectedPelanggar.map(p => p.nama).filter(Boolean).join(", ")
        return {
          key: s.key,
          pelanggar_keys: s.pelanggarKeys || [],
          pelanggar_list: selectedPelanggar,
          pelanggar_nama: pNames || "-",
          tempat_sidang: s.tempatSidang || "-",
          khd_tanggal: s.khdTanggal,
          khd_nomor: s.khdNomor,
          putusan: s.putusan,
          catatan: s.catatan,
          banding: s.banding,
          banding_tanggal: s.bandingTanggal,
          banding_memo: s.bandingMemo,
        }
      })

      const res = await fetch("/api/unit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize_wabprof",
          pengaduanId, prepetratorId, currentPosition,
          sidang_list: mappedSidangList,
          skip_gajamada: !updateGajamada,
        }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      setSuccess(j.message)
      router.refresh()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }

  const title = (config?.title as string) ?? "Proses Wabprof"

  return (
    <AksiCard title={title} variant="warning">
      <div className="space-y-2">
        <div className="flex gap-0 border-b border-gray-700 -mx-2 px-2">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key ? "text-yellow-300 border-yellow-400 bg-yellow-900/30" : "text-gray-400 border-transparent hover:text-gray-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "pemeriksaan_awal" && (
          <div className="space-y-3">
            <PemeriksaanAwalTab
              gelarBlock={gelarBlock} setGelarBlock={setGelarBlock}
              lpABlock={lpABlock} setLpABlock={setLpABlock}
              sprinRiksaBlock={sprinRiksaBlock} setSprinRiksaBlock={setSprinRiksaBlock}
              dp3dBlock={dp3dBlock} setDp3dBlock={setDp3dBlock}
              customTemplates={customTemplates} onSimpanDok={simpanDok}
              showDp3dLimpah={showLimpahBlock}
              onDp3dLimpahClick={() => setShowLimpahBlock(!showLimpahBlock)}
              gelarTitle="Gelar Perkara Wabprof"
              dp3dTitle="Berkas Perkara"
            />

            {/* Opsi Pelimpahan Berkas Perkara ke Satker / Polres */}
            {dp3dStatus === "limpah" && (
              <div className="border border-yellow-600/50 bg-[#0F172A] rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-yellow-300">Pelimpahan Berkas Perkara ke Satker / Polres</p>
                  <button onClick={() => setShowLimpahBlock(!showLimpahBlock)} className="text-xs text-yellow-400 hover:text-yellow-300 underline">
                    {showLimpahBlock ? "Sembunyikan Nota Dinas" : "Isi Nota Dinas Pelimpahan"}
                  </button>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Satker / Polres Tujuan</p>
                  <select value={dp3dLimpahan} onChange={e => setDp3dLimpahan(e.target.value)}
                    className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                    <option value="">Pilih satker / polres tujuan...</option>
                    {catalogUnit.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                {showLimpahBlock && (
                  <DocBlockComp title="Surat / Nota Dinas Pelimpahan Berkas Perkara" docType="nota_dinas_dp3d" block={limpahBlock} setter={setLimpahBlock} customTemplates={customTemplates} onSimpanDok={simpanDok} />
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleLimpahDP3D} disabled={loading || !dp3dLimpahan}
                    className="text-sm px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-medium disabled:opacity-40">
                    Proses Pelimpahan Berkas Perkara
                  </button>
                </div>
              </div>
            )}
            
            <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={updateGajamada} onChange={e => setUpdateGajamada(e.target.checked)} className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
              Update Timeline Gajamada
            </label>
            <div className="flex gap-1.5">
              <button onClick={handleSaveRiksaAwal} disabled={loading || !gelarBlock.tanggal || !lpABlock.tanggal}
                className="flex-1 flex items-center justify-center gap-1 text-sm px-2 py-1.5 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-40">
                {loading ? "..." : ""}Simpan & Update Status
              </button>
              <button onClick={() => { setGelarBlock(emptyBlock()); setLpABlock(emptyBlock()); setSprinRiksaBlock(emptyBlock()); setDp3dBlock(emptyBlock()); setDp3dStatus("none"); setDp3dLimpahan(""); setLimpahBlock(emptyBlock()); setShowLimpahBlock(false) }}
                className="px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-white rounded text-sm">
                Reset
              </button>
            </div>
          </div>
        )}

        {activeTab === "sidang" && (
          <div className="space-y-4">
            {/* Data Pelanggar ditaruh di Atas sebelum Sidang */}
            <div className="border border-gray-700 bg-[#0F172A] rounded p-2.5">
              <PelanggarTab
                pelanggarList={pelanggarList} setPelanggarList={setPelanggarList}
                catalogPasal={catalogPasal} catalogWujud={catalogWujud}
                catalogPangkat={catalogPangkat} catalogFunctional={catalogFunctional}
                loading={loading} error={error} success={success}
                onSavePelanggar={handleSavePelanggar}
                onReset={() => { if (confirm("Reset semua data terduga pelanggar?")) setPelanggarList([]) }}
                updateGajamada={updateGajamada}
              />
            </div>

            {/* Sesi Sidang KKEP */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-700 pb-1">
                <p className="text-sm font-semibold text-yellow-300">Pelaksanaan Sidang KKEP (Perpol No. 7 Tahun 2022)</p>
              </div>

              <SidangKkepTab
                sidangList={sidangList}
                setSidangList={setSidangList}
                pelanggarOptions={pelanggarList}
                customTemplates={customTemplates}
                onSimpanKhd={simpanKhd}
              />

              <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={updateGajamada} onChange={e => setUpdateGajamada(e.target.checked)} className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                Update Timeline Gajamada
              </label>

              <div className="flex gap-1.5 mt-2">
                <button onClick={handleSidangSave} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1 text-sm px-2 py-1.5 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-40">
                  {loading ? "..." : ""}Simpan & Update Status
                </button>
                <button onClick={() => setSidangList([emptySidangKkepEntry()])}
                  className="px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-white rounded text-sm">
                  Reset
                </button>
              </div>

              {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
              {success && <p className="text-sm text-green-400 mt-1">{success}</p>}
            </div>
          </div>
        )}

        {activeTab === "rekap" && (
          <RekapTab
            stage="pelaporan" hasil="proses" gelarTgl={gelarBlock.tanggal} gelarNo={gelarBlock.nomor}
            tlList={[]} pelanggarList={pelanggarList} pelimpahan=""
            error={error} success={success} updateGajamada={updateGajamada}
            onToggleUpdate={setUpdateGajamada}
            onSubmit={handleFinalize}
            loading={loading} pengaduan={pengaduan} isDone={isDone} pengaduanId={pengaduanId}
            dokumenList={dokumenList}
            pelimpahanKe={dp3dLimpahan}
            pelimpahanNomor={limpahBlock.nomor}
            pelimpahanTgl={limpahBlock.tanggal}
          />
        )}
      </div>
    </AksiCard>
  )
}
