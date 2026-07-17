import { createServiceClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import type { Pengaduan, TimelineEntry, Catatan } from "@/types"

const df = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })
const dft = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

function fd(d: string | null | undefined) { return d ? df.format(new Date(d)) : "-" }
function fdt(d: string | null | undefined) { return d ? dft.format(new Date(d)) : "-" }

export default async function CetakPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: pengaduan, error } = await supabase.from("pengaduan").select("*").eq("id", id).single()
  if (error || !pengaduan) notFound()

  const p = pengaduan as Pengaduan

  // Timeline — try exact prepetrator_id, also try base ID (without -NNN suffix)
  let { data: timeline } = await supabase.from("timeline").select("*").eq("prepetrator_id", p.prepetrator_id).order("date_activity", { ascending: true })
  if (!timeline?.length) {
    const baseId = p.prepetrator_id?.split("-")[0]
    if (baseId && baseId !== p.prepetrator_id) {
      const { data: tl2 } = await supabase.from("timeline").select("*").eq("prepetrator_id", baseId).order("date_activity", { ascending: true })
      timeline = tl2
    }
  }

  // Catatan lokal
  const { data: catatanList } = await supabase.from("catatan").select("*").eq("pengaduan_id", id).order("created_at", { ascending: true })

  // Reporter count
  let reportCountLocal = 0
  if (p.reporter_nik) {
    const { count } = await supabase.from("pengaduan").select("*", { count: "exact", head: true }).eq("reporter_nik", p.reporter_nik)
    reportCountLocal = count ?? 0
  }

  const allTimeline = [
    ...(timeline ?? []).map((t: TimelineEntry) => ({ date: t.date_activity, content: t.status || t.handling_progress || "", officer: t.officer_name, position: t.case_position })),
    ...(catatanList ?? []).map((c: Catatan) => ({ date: c.created_at, content: c.content, officer: c.author_role, position: "" })),
  ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.onload = () => setTimeout(() => window.print(), 300)` }} />
      <div className="bg-white text-black p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none print:mx-0 font-sans text-sm">

        {/* Header: Logo kiri, Nama aplikasi tengah, Logo Sponsor kanan */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <Image src="/logo propam pengaduan.png" alt="Logo" width={48} height={48} className="h-12 w-auto" />
            <div>
              <h1 className="text-base font-bold leading-tight">E-PROPAM</h1>
              <p className="text-[10px] text-gray-600 leading-tight">MONITORING DUMAS</p>
              <p className="text-[10px] text-gray-600 leading-tight">BIDPROPAM POLDA JABAR</p>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-sm font-bold">LEMBAR INFORMASI PENGADUAN</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">Dicetak: {fdt(new Date().toISOString())}</p>
          </div>
          <Image src="/logo-jaga-rawat.png" alt="Sponsor" width={64} height={48} className="h-12 w-auto" />
        </div>

        {/* A. Informasi Dasar */}
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
                ["Tgl. Kejadian", fd(p.tgl_kejadian)],
                ["Alamat Kejadian", p.alamat_kejadian || "-"],
                ["Tgl. Laporan", fd(p.created_date)],
              ].map(([label, value]) => (
                <tr key={label as string} className="border-b border-gray-200">
                  <td className="py-1 pr-4 font-semibold w-[140px] align-top">{label}</td>
                  <td className="py-1">{String(value ?? "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* B. Informasi Pelapor */}
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
                ["Jumlah Laporan (Polda Jabar)", reportCountLocal > 0 ? String(reportCountLocal) : "-"],
              ].map(([label, value]) => (
                <tr key={label as string} className="border-b border-gray-200">
                  <td className="py-1 pr-4 font-semibold w-[140px] align-top">{label}</td>
                  <td className="py-1">{String(value ?? "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* C. Informasi Terlapor */}
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

        {/* D. Rangkuman — selalu halaman 2 */}
        <div className="print:break-before-page">
          <h2 className="text-sm font-bold border-b border-black pb-1 mb-2">D. RANGKUMAN / KRONOLOGI</h2>
          <p className="text-xs whitespace-pre-wrap">{p.content || p.summary || "Tidak ada rangkuman."}</p>
        </div>

        {/* E. Timeline */}
        <div className="mb-4 mt-4">
          <h2 className="text-sm font-bold border-b border-black pb-1 mb-2">E. TIMELINE / RIWAYAT PENANGANAN</h2>
          {allTimeline.length === 0 ? (
            <p className="text-xs text-gray-500">Belum ada riwayat.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-1 w-[110px]">Tanggal</th>
                  <th className="text-left py-1">Aktivitas</th>
                  <th className="text-left py-1 w-[90px]">Petugas</th>
                  <th className="text-left py-1 w-[130px]">Posisi Kasus</th>
                </tr>
              </thead>
              <tbody>
                {allTimeline.map((t, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-1 align-top">{fd(t.date)}</td>
                    <td className="py-1 align-top whitespace-pre-wrap">{t.content}</td>
                    <td className="py-1 align-top text-xs">{t.officer || "-"}</td>
                    <td className="py-1 align-top text-xs">{t.position || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-8 print:hidden">— Akhir Lembar —</p>
      </div>
    </>
  )
}
