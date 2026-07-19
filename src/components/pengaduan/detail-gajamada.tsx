"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import type { Pengaduan } from "@/types"

function row(label: string, value: string | null | undefined, options?: { multiline?: boolean; highlight?: string; mono?: boolean; uppercase?: boolean; maxLines?: number; badge?: string }) {
  const v = value ?? "-"
  const clampStyle = options?.maxLines
    ? {
        display: "-webkit-box",
        WebkitLineClamp: options.maxLines,
        WebkitBoxOrient: "vertical" as const,
        overflow: "auto",
      }
    : undefined
  return (
    <div className="grid grid-cols-3 gap-1.5 py-0 text-sm">
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <p
        style={clampStyle}
        className={`col-span-2 ${options?.badge ? `inline-block text-xs px-1.5 py-0.5 rounded uppercase ${options.badge} w-fit` : ""} ${options?.mono ? "font-mono text-xs" : ""} ${options?.uppercase && !options?.badge ? "uppercase" : ""} ${options?.highlight && !options?.badge ? options.highlight : "text-gray-800"} ${options?.multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {v}
      </p>
    </div>
  )
}

interface CardProps {
  title: string
  badge?: string
  action?: React.ReactNode
  children: React.ReactNode
  scrollable?: boolean
}

export function SectionCard({ title, badge, action, children, className, scrollable }: CardProps & { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col ${className ?? ""}`}>
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{badge}</span>}
        </div>
        {action}
      </div>
      <div className={`p-2 flex-1 min-h-0 ${scrollable ? "overflow-y-auto" : ""}`}>{children}</div>
    </div>
  )
}

export function DetailDasar({ pengaduanId, pengaduan }: { pengaduanId: string; pengaduan: Pengaduan }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const router = useRouter()

  async function refreshDetail() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/pengaduan/${pengaduanId}/detail`, { method: "POST" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setMsg(`Berhasil memperbarui ${json.updated} field.`)
      router.refresh()
    } catch (e: any) {
      setMsg(`Gagal: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const p = pengaduan
  const hasDetail = p.summary || p.content || p.category || p.alamat_kejadian

  return (
    <SectionCard
      title="Informasi Dasar Laporan"
      className="h-full"
      action={
        <Button size="sm" variant="outline" onClick={refreshDetail} disabled={loading} className="text-xs h-6">
          {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Sinkronkan
        </Button>
      }
    >
      {msg && <p className="text-xs text-gray-500 mb-1">{msg}</p>}
      {!hasDetail && (
        <p className="text-xs text-gray-400 italic mb-2">
          Detail belum tersedia. Klik "Sinkronkan".
        </p>
      )}
      <div className="divide-y divide-gray-100">
        {row("Nomor Laporan", p.id, { mono: true })}
        {row("Status", p.status_label, { badge: "bg-blue-100 text-blue-800" })}
        {row("Posisi Laporan", p.case_position, { badge: "bg-purple-100 text-purple-800" })}
        {row("Sub Status", p.sub_status, { highlight: "text-orange-700", multiline: true })}
        {row("Waktu Lapor", p.created_date ? new Date(p.created_date).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null)}
        {row("Lokasi Kejadian", p.alamat_kejadian)}
        {row("Kategori", p.category, { uppercase: true })}
        {row("Sub Kategori", p.sub_category)}
        {row("Wujud Perbuatan", p.summary ?? p.content, { multiline: true, maxLines: 6 })}
      </div>
    </SectionCard>
  )
}

export function DetailPelapor({ pengaduan, reportCountPolda, reportCountNasional, action }: { pengaduan: Pengaduan; reportCountPolda?: number; reportCountNasional?: number; action?: React.ReactNode }) {
  const p = pengaduan
  return (
    <SectionCard title="Informasi Pelapor" action={action}>
      <div className="divide-y divide-gray-100">
        <div className="grid grid-cols-3 gap-1.5 py-0 text-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Nama</p>
          <p className="col-span-2 text-gray-800 flex items-center gap-2">
            {p.pengirim || "-"}
            {(reportCountPolda ?? 0) > 1 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                {reportCountPolda} Polda Jabar
              </span>
            )}
            {(reportCountNasional ?? 0) > 0 && reportCountNasional !== reportCountPolda && (
              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                {reportCountNasional} Nasional
              </span>
            )}
          </p>
        </div>
        {row("NIK", p.reporter_nik, { mono: true })}
        {row("Nomor Telepon", p.phone_no, { mono: true })}
        {row("Email", p.email)}
        {row("Sumber Aduan", p.source)}
        {row("Alamat", p.pengirim_address, { multiline: true })}
      </div>
    </SectionCard>
  )
}

export function DetailTerlapor({ pengaduan }: { pengaduan: Pengaduan }) {
  const p = pengaduan
  const [data, setData] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    if (!p.prepetrator_id) return
    fetch(`/api/pelanggar?prepetrator_id=${encodeURIComponent(p.prepetrator_id)}`)
      .then(r => r.json())
      .then(j => { if (j.success && j.data) setData(j.data) })
      .catch(() => {})
  }, [p.prepetrator_id])

  const d = data || {}
  const nama = d.name || p.terlapor_name
  const pangkat = d.rank || p.terlapor_rank
  const jabatan = d.position || p.terlapor_position
  const nrp = d.identity_number || p.terlapor_nrp
  const satuan = d.division || p.terlapor_division

  return (
    <SectionCard title="Informasi Terlapor" className="h-full">
      <div className="divide-y divide-gray-100">
        {row("Nama", nama)}
        {row("Pangkat", pangkat)}
        {row("Jabatan", jabatan)}
        {row("NRP", nrp, { mono: true })}
        {row("Satuan", satuan)}
      </div>
    </SectionCard>
  )
}
