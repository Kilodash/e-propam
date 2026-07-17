import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { Pengaduan, TimelineEntry, Catatan } from "@/types"

export default async function CetakPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: pengaduan, error } = await supabase.from("pengaduan").select("*").eq("id", id).single()
  if (error || !pengaduan) notFound()

  const p = pengaduan as Pengaduan

  // Timeline
  const { data: timeline } = await supabase.from("timeline").select("*").eq("prepetrator_id", p.prepetrator_id).order("date_activity", { ascending: true })

  // Catatan lokal
  const { data: catatanList } = await supabase.from("catatan").select("*").eq("pengaduan_id", id).order("created_at", { ascending: true })

  // Reporter count local
  let reportCountLocal = 0
  if (p.reporter_nik) {
    const { count } = await supabase.from("pengaduan").select("*", { count: "exact", head: true }).eq("reporter_nik", p.reporter_nik)
    reportCountLocal = count ?? 0
  }

  const f = (d: string | null | undefined) => d ? format(new Date(d), "dd MMM yyyy", { locale: id }) : "-"
  const fdt = (d: string | null | undefined) => d ? format(new Date(d), "dd MMM yyyy HH:mm", { locale: id }) : "-"

  const allTimeline = [
    ...(timeline ?? []).map((t: TimelineEntry) => ({ date: t.date_activity, content: t.status || t.handling_progress || "", officer: t.officer_name, position: t.case_position })),
    ...(catatanList ?? []).map((c: Catatan) => ({ date: c.created_at, content: c.content, officer: c.author_role, position: "" })),
  ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.onload = () => setTimeout(() => window.print(), 300)` }} />
      <div className="bg-white text-black p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none print:mx-0 font-sans text-sm">
        <div className="text-center mb-6 border-b-2 border-black pb-4 print:border-black">
          <h1 className="text-lg font-bold">LEMBAR INFORMASI PENGADUAN</h1>
          <p className="text-xs mt-1">BIDPROPAM POLDA JAWA BARAT</p>
          <p className="text-xs text-gray-600 mt-2">Dicetak: {fdt(new Date().toISOString())}</p>
        </div>

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

        <div className="mb-4">
          <h2 className="text-sm font-bold border-b border-black pb-1 mb-2">D. RANGKUMAN / KRONOLOGI</h2>
          <p className="text-xs whitespace-pre-wrap">{p.content || p.summary || "Tidak ada rangkuman."}</p>
        </div>

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
    </>
  )
}
