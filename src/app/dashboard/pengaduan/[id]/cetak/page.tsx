"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Printer } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Pengaduan {
  id: string; prepetrator_id: string
  pengirim?: string | null; pengirim_address?: string | null; phone_no?: string | null; email?: string | null
  reporter_nik?: string | null
  terlapor_name?: string | null; terlapor_rank?: string | null; terlapor_position?: string | null
  terlapor_nrp?: string | null; terlapor_division?: string | null
  content?: string | null; summary?: string | null; category?: string | null; sub_category?: string | null
  status_label?: string | null; case_position?: string | null
  alamat_kejadian?: string | null; tgl_kejadian?: string | null
  created_date?: string | null; source?: string | null; source_alias?: string | null
  saran_kabid?: string | null; telaah?: boolean | null; kelengkapan?: boolean | null
  disposisi_satker_tujuan?: string | null; unit_progress?: string | null
}

interface TimelineEntry {
  id: string; prepetrator_id: string
  status?: string | null; case_position?: string | null
  date_activity?: string | null; handling_progress?: string | null
  officer_name?: string | null; subject?: string | null
}

interface Catatan {
  id: string; content: string; created_at: string; author_role: string; author_email: string
}

export default function CetakPage() {
  const { id } = useParams<{ id: string }>()
  const [p, setP] = useState<Pengaduan | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [catatan, setCatatan] = useState<Catatan[]>([])
  const [reportCountLocal, setReportCountLocal] = useState(0)
  const [reportCountNasional, setReportCountNasional] = useState(0)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/pengaduan/${id}/detail`).then(r => r.json()),
      fetch(`/api/bukti?prepetratorId=${encodeURIComponent(id)}`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/bukti?rekapPrepetratorId=${encodeURIComponent(id)}`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/catatan?pengaduan_id=${encodeURIComponent(id)}`).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([detailJson, buktiJson, rekapJson, catatanJson]) => {
      const d = detailJson.data ?? detailJson
      setP(d)
      setTimeline(Array.isArray(buktiJson?.data) ? [] : [])

      // Fetch timeline from prepetratorId
      const pid = d?.prepetrator_id
      if (pid) {
        fetch(`/api/sync?prepetratorId=${encodeURIComponent(pid)}&mode=timeline`).then(r => r.json()).then(tj => {
          setTimeline(Array.isArray(tj.data) ? tj.data : [])
        }).catch(() => {})
      }

      setCatatan(Array.isArray(catatanJson?.data) ? catatanJson.data : [])

      if (d?.reporter_nik) {
        fetch(`/api/reporter-count?nik=${encodeURIComponent(d.reporter_nik)}`).then(r => r.json()).then(rc => {
          setReportCountLocal(rc.polda ?? 0)
          setReportCountNasional(rc.nasional ?? 0)
        }).catch(() => {})
      }
    })
  }, [id])

  useEffect(() => {
    if (p) {
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [p])

  if (!p) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const f = (d: string | null | undefined) => d ? format(new Date(d), "dd MMM yyyy", { locale: id }) : "-"
  const fdt = (d: string | null | undefined) => d ? format(new Date(d), "dd MMM yyyy HH:mm", { locale: id }) : "-"

  const allTimeline = [
    ...timeline.map(t => ({ date: t.date_activity, content: t.status || t.handling_progress || "", officer: t.officer_name, position: t.case_position })),
    ...catatan.map(c => ({ date: c.created_at, content: c.content, officer: c.author_role, position: "" })),
  ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())

  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none print:mx-0 font-sans text-sm">
      <div className="text-center mb-6 border-b-2 border-black pb-4 print:border-black">
        <h1 className="text-lg font-bold">LEMBAR INFORMASI PENGADUAN</h1>
        <p className="text-xs mt-1">BIDPROPAM POLDA JAWA BARAT</p>
        <p className="text-xs text-gray-600 mt-2">Dicetak: {fdt(new Date().toISOString())}</p>
      </div>

      {/* Informasi Dasar Laporan */}
      <div className="mb-4">
        <h2 className="text-sm font-bold border-b border-black pb-1 mb-2">A. INFORMASI DASAR LAPORAN</h2>
        <table className="w-full text-xs">
          <tbody>
            {[
              ["No. Laporan", p.id],
              ["No. Prepetrator", p.prepetrator_id],
              ["Status", p.status_label],
              ["Posisi Kasus", p.case_position],
              ["Sumber", p.source === "internal" ? `Internal (${p.source_alias || "-"})` : p.source || "Gajamada"],
              ["Kategori", p.category || "-"],
              ["Sub Kategori", p.sub_category || "-"],
              ["Tgl. Kejadian", f(p.tgl_kejadian)],
              ["Alamat Kejadian", p.alamat_kejadian || "-"],
              ["Tgl. Laporan", f(p.created_date)],
            ].map(([label, value]) => (
              <tr key={label as string} className="border-b border-gray-200">
                <td className="py-1 pr-4 font-semibold w-[140px] align-top">{label}</td>
                <td className="py-1">{String(value ?? "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Informasi Pelapor */}
      <div className="mb-4">
        <h2 className="text-sm font-bold border-b border-black pb-1 mb-2">B. INFORMASI PELAPOR</h2>
        <table className="w-full text-xs">
          <tbody>
            {[
              ["Nama", p.pengirim],
              ["NIK", p.reporter_nik],
              ["Alamat", p.pengirim_address],
              ["No. Telepon", p.phone_no],
              ["Email", p.email],
              ["Jumlah Laporan (Polda)", reportCountLocal > 0 ? String(reportCountLocal) : "-"],
              ["Jumlah Laporan (Nasional)", reportCountNasional > 0 ? String(reportCountNasional) : "-"],
            ].map(([label, value]) => (
              <tr key={label as string} className="border-b border-gray-200">
                <td className="py-1 pr-4 font-semibold w-[140px] align-top">{label}</td>
                <td className="py-1">{String(value ?? "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Informasi Terlapor */}
      <div className="mb-4">
        <h2 className="text-sm font-bold border-b border-black pb-1 mb-2">C. INFORMASI TERLAPOR</h2>
        <table className="w-full text-xs">
          <tbody>
            {[
              ["Nama", p.terlapor_name],
              ["NRP", p.terlapor_nrp],
              ["Pangkat", p.terlapor_rank],
              ["Jabatan", p.terlapor_position],
              ["Kesatuan", p.terlapor_division],
            ].map(([label, value]) => (
              <tr key={label as string} className="border-b border-gray-200">
                <td className="py-1 pr-4 font-semibold w-[140px] align-top">{label}</td>
                <td className="py-1">{String(value ?? "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rangkuman / Kronologi */}
      <div className="mb-4">
        <h2 className="text-sm font-bold border-b border-black pb-1 mb-2">D. RANGKUMAN / KRONOLOGI</h2>
        <p className="text-xs whitespace-pre-wrap">{p.content || p.summary || "Tidak ada rangkuman."}</p>
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <h2 className="text-sm font-bold border-b border-black pb-1 mb-2">E. TIMELINE / RIWAYAT PENANGANAN</h2>
        {allTimeline.length === 0 ? (
          <p className="text-xs text-gray-500">Belum ada riwayat.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1 w-[120px]">Tanggal</th>
                <th className="text-left py-1">Aktivitas</th>
                <th className="text-left py-1 w-[100px]">Petugas</th>
                <th className="text-left py-1 w-[140px]">Posisi Kasus</th>
              </tr>
            </thead>
            <tbody>
              {allTimeline.map((t, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1 align-top">{f(t.date)}</td>
                  <td className="py-1 align-top whitespace-pre-wrap">{t.content}</td>
                  <td className="py-1 align-top text-xs">{t.officer || "-"}</td>
                  <td className="py-1 align-top text-xs">{t.position || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-8 print:hidden">— Akhir Lembar —</p>
    </div>
  )
}
