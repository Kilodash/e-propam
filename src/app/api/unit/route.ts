import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { executeGajamadaGateway, GATEWAY_KASUBBID_TERIMA } from "@/lib/gajamada/gateway"
import { getCookie as getGajamadaCookie } from "@/lib/gajamada/client"
import { incrementRegister } from "@/lib/aksi-cards/buku-register"
import { buildNomor } from "@/lib/template-nomor"

async function callGajamada(params: Record<string, any>) {
  const cookie = await getGajamadaCookie().catch(() => undefined)
  if (!cookie) { console.error("Gajamada cookie not available"); return }
  await executeGajamadaGateway({
    gatewayId: GATEWAY_KASUBBID_TERIMA,
    cookie,
    userId: process.env.GAJAMADA_USER_ID,
    widgetId: "epropam-unit",
    widgetName: "E-PROPAM Unit Action",
    params,
  }).catch((e: any) => console.error("Gajamada unit action failed:", e.message))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, pengaduanId, prepetratorId, currentPosition, progress, nextStatus, hasil, rekomendasi } = body

  if (!pengaduanId || !prepetratorId) {
    return NextResponse.json({ success: false, error: "pengaduanId dan prepetratorId wajib" }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (action) {
      case "mulai": {
        const casePosition = currentPosition || "Unit"
        const gajamadaStatus = "Proses Lidik"

        await callGajamada({
          report_id: prepetratorId,
          note: "UNIT MULAI PROSES",
          createdBy: "E-PROPAM Unit",
          case_handover: "",
          status: gajamadaStatus,
          case_position: casePosition,
        })

        const { error } = await supabase.from("pengaduan").update({
          unit_status: "dalam_proses",
          unit_started_at: new Date().toISOString(),
          case_position: casePosition,
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }).eq("id", pengaduanId)

        if (error) throw error
        return NextResponse.json({ success: true, message: "Mulai proses" })
      }

      case "progress": {
        if (!progress?.trim()) {
          return NextResponse.json({ success: false, error: "Progress wajib diisi" }, { status: 400 })
        }
        const casePosition = currentPosition || "Unit"
        const gajamadaStatus = nextStatus || "Proses Lidik"

        await callGajamada({
          report_id: prepetratorId,
          note: `UNIT PROGRESS: ${progress}`,
          createdBy: "E-PROPAM Unit",
          case_handover: "",
          status: gajamadaStatus,
          case_position: casePosition,
        })

        const { error } = await supabase.from("pengaduan").update({
          unit_progress: progress,
          unit_status: "dalam_proses",
          case_position: casePosition,
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }).eq("id", pengaduanId)

        if (error) throw error
        return NextResponse.json({ success: true, message: "Progress dicatat" })
      }

      case "selesai": {
        if (!hasil?.trim()) {
          return NextResponse.json({ success: false, error: "Hasil penyelidikan wajib diisi" }, { status: 400 })
        }
        const casePosition = currentPosition || "Unit"
        const gajamadaStatus = rekomendasi?.startsWith("limpah") ? "Laporan Dikirim ke Unit" : "Selesai"

        await callGajamada({
          report_id: prepetratorId,
          note: `UNIT SELESAI — Hasil: ${hasil} — Rekomendasi: ${rekomendasi || "selesai"}`,
          createdBy: "E-PROPAM Unit",
          case_handover: "",
          status: gajamadaStatus,
          case_position: casePosition,
        })

        const { error } = await supabase.from("pengaduan").update({
          unit_status: "selesai",
          unit_completed_at: new Date().toISOString(),
          case_position: casePosition,
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }).eq("id", pengaduanId)

        if (error) throw error
        return NextResponse.json({ success: true, message: "Proses selesai" })
      }

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
        const { hasil, terbukti, pelimpahan, catatan, tindak_lanjut, dokumen,
          pelanggar_nama, pelanggar_nrp, pelanggar_jabatan,
          kategori_pelanggaran, wujud_perbuatan, pasal_dilanggar } = body

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
          terbukti && pelanggar_nama ? `Pelanggar: ${pelanggar_nama} / NRP: ${pelanggar_nrp || "-"} / ${pelanggar_jabatan || "-"}` : "",
          terbukti && kategori_pelanggaran ? `Kategori: ${kategori_pelanggaran}` : "",
          terbukti && wujud_perbuatan ? `Wujud Perbuatan: ${wujud_perbuatan}` : "",
          terbukti && pasal_dilanggar ? `Pasal: ${pasal_dilanggar}` : "",
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

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
