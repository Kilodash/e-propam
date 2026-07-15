import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { executeGajamadaGateway, GATEWAY_KASUBBID_TERIMA } from "@/lib/gajamada/gateway"
import { getCookie as getGajamadaCookie } from "@/lib/gajamada/client"

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

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
