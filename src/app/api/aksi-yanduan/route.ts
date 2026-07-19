import { NextRequest, NextResponse } from "next/server"
import {
  overrideDistribusi,
  kembalikanKeMabes,
  simpanSaranKabid,
  submitKeKabid,
} from "@/lib/gajamada/aksi-yanduan"
import { executeGajamadaGateway, GATEWAY_KASUBBID_TERIMA } from "@/lib/gajamada/gateway"
import { getCookie as getGajamadaCookie, loginGajamada } from "@/lib/gajamada/client"
import { createServiceClient } from "@/lib/supabase/server"

async function ensureGajamadaCookie(): Promise<string | undefined> {
  try {
    const cookie = await getGajamadaCookie()
    const test = await fetch(`${process.env.GAJAMADA_BASE_URL}/api/v1/apps/auth/validate`, {
      headers: { Cookie: cookie },
    })
    if (test.ok) return cookie
    return await loginGajamada()
  } catch {
    try { return await loginGajamada() } catch { return undefined }
  }
}

async function resolveGajamadaPosition(targetUnit: string): Promise<string> {
  try {
    const supabase = createServiceClient()
    const { data: mapping } = await supabase
      .from("unit_mapping")
      .select("fallback_position")
      .eq("gajamada_name", targetUnit)
      .maybeSingle()
    if (mapping?.fallback_position) {
      console.log(`Aksi: using fallback position "${mapping.fallback_position}" instead of "${targetUnit}"`)
      return mapping.fallback_position
    }
  } catch { /* fall through */ }
  return targetUnit
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, ...args } = body

  try {
    let result
    switch (action) {
      case "override":
        result = await overrideDistribusi(args)
        break
      case "override_status": {
        const updateTimeline = args.updateTimeline !== false

        const supabase = createServiceClient()
        const { data: row } = await supabase.from("pengaduan").select("case_position, prepetrator_id, status_label").eq("id", args.pengaduanId).single()
        const currentUnit = row?.case_position || "Unit"
        const prepId = args.prepetratorId || row?.prepetrator_id
        const currentStatus = row?.status_label || ""

        // Ambil nama user dari profile
        let createdBy = currentUnit
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase.from("profiles").select("full_name, unit_name").eq("id", user.id).single()
            if (profile?.full_name) createdBy = profile.full_name
          }
        } catch {}

        // Sync ke Gajamada — note kosong jika timeline tidak di-update
        if (args.targetUnit || args.status) {
          const cookie = await ensureGajamadaCookie()
          if (!cookie) {
            result = { success: false, error: "Tidak dapat terhubung ke Gajamada (session expired). Silakan login ulang." }
            break
          }
          const gatewayParams: Record<string, unknown> = {
            report_id: prepId,
            note: updateTimeline ? (args.alasan || `Override: ${args.status || args.targetUnit || ""}`) : "",
            createdBy,
            case_handover: "",
            status: args.status || currentStatus,
            case_position: args.targetUnit || currentUnit,
          }
          try {
            await executeGajamadaGateway({
              gatewayId: GATEWAY_KASUBBID_TERIMA,
              cookie,
              userId: process.env.GAJAMADA_USER_ID,
              widgetId: "epropam-unit",
              widgetName: "E-PROPAM Unit Action",
              params: gatewayParams,
            })
          } catch (e: any) {
            result = { success: false, error: `Gagal sync ke Gajamada: ${e.message || "unknown error"}. Data local tidak diubah.` }
            break
          }
        }

        const updates: Record<string, unknown> = {
          override_alasan: args.alasan || null,
          override_at: new Date().toISOString(),
          synced_at: new Date().toISOString(),
        }
        if (args.targetUnit) {
          updates.case_position = args.targetUnit
          updates.previous_case_position = currentUnit
          updates.override_unit = args.targetUnit
        }
        if (args.status) {
          updates.status_label = args.status
        }
        const { error } = await supabase.from("pengaduan").update(updates).eq("id", args.pengaduanId)
        if (error) {
          result = { success: false, error: error.message }
        } else {
          result = { success: true, message: `Override berhasil + sync Gajamada${updateTimeline ? " (dengan timeline)" : ""}` }
        }
        break
      }
      case "kembalikan": {
        const supabase = createServiceClient()
        const targetRole: string = args.targetRole ?? "mabes"
        const gajamadaStatus = targetRole === "mabes" ? "Laporan Ditolak" : `Laporan Dikembalikan ke ${targetRole}`
        
        const { data: row } = await supabase.from("pengaduan").select("case_position").eq("id", args.pengaduanId).single()
        const gajamadaCase = targetRole === "mabes" ? "DIVPROPAM POLRI" : (row?.case_position || "DIVPROPAM POLRI")
        const currentUnit = row?.case_position || "Yanduan"

        const cookie = await ensureGajamadaCookie()

        await executeGajamadaGateway({
          gatewayId: GATEWAY_KASUBBID_TERIMA,
          cookie,
          userId: process.env.GAJAMADA_USER_ID,
          widgetId: "epropam-kembalikan",
          widgetName: "E-PROPAM Pengembalian",
          params: {
            report_id: args.prepetratorId,
            note: `${args.alasan || ""} [Dikembalikan ke ${targetRole}]`,
            createdBy: currentUnit,
            case_handover: "",
            status: gajamadaStatus,
            case_position: gajamadaCase,
          },
        }).catch((e: any) => console.error("Gajamada kembalikan failed:", e.message))

        const { error } = await supabase.from("pengaduan").update({
          kembalikan_alasan: args.alasan ?? null,
          kembalikan_at: new Date().toISOString(),
          kembalikan_by: targetRole,
          case_position: gajamadaCase,
          previous_case_position: currentUnit,
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }).eq("id", args.pengaduanId)

        if (error) {
          result = { success: false, error: error.message }
        } else {
          result = { success: true, message: `Dikembalikan ke ${targetRole}` }
        }
        break
      }
      case "distribute": {
        const supabase = createServiceClient()
        const targetUnit = args.targetUnit || args.targetRole
        const note = `${args.alasan ?? ""}`
        const gajamadaStatus = (args.gajamadaStatus as string) || "PROSES LIDIK"

        const cookie = await ensureGajamadaCookie()

        const { data: row } = await supabase
          .from("pengaduan")
          .select("case_position")
          .eq("id", args.pengaduanId)
          .single()
        const currentUnit = row?.case_position || "Unit"

        // Check fallback_position for manual units not yet in Gajamada
        const gajamadaPosition = await resolveGajamadaPosition(targetUnit)

        await executeGajamadaGateway({
          gatewayId: GATEWAY_KASUBBID_TERIMA,
          cookie,
          userId: process.env.GAJAMADA_USER_ID,
          widgetId: "epropam-distribusi",
          widgetName: "E-PROPAM Distribusi",
          params: {
            report_id: args.prepetratorId,
            note,
            createdBy: currentUnit,
            case_handover: "",
            status: gajamadaStatus,
            case_position: gajamadaPosition,
          },
        }).catch((e: any) => console.error("Gajamada distribusi failed:", e.message))

        // Save checklist items as catatan timeline entries
        const checklist = (args.checklist ?? []) as { label: string; note: string }[]
        if (checklist.length > 0) {
          const catatanEntries = checklist.map(c => ({
            pengaduan_id: args.pengaduanId,
            prepetrator_id: args.prepetratorId,
            author_email: "propam.polda@polri.go.id",
            author_role: "distribusi",
            content: c.note ? `${c.label} — ${c.note}` : c.label,
          }))
          const { error: catatanErr } = await supabase.from("catatan").insert(catatanEntries)
          if (catatanErr) console.error("Catatan insert failed:", catatanErr.message)
        }

        const { error } = await supabase
          .from("pengaduan")
          .update({
            disposisi_satker_tujuan: targetUnit,
            disposisi_satker_at: new Date().toISOString(),
            case_position: targetUnit,
            previous_case_position: currentUnit,
            synced_at: new Date().toISOString(),
          })
          .eq("id", args.pengaduanId)
        if (error) {
          result = { success: false, error: error.message }
        } else {
          result = { success: true, message: `Didistribusikan ke ${targetUnit}` }
        }
        break
      }
      case "save_draft":
        result = await simpanSaranKabid({
          pengaduanId: args.pengaduanId,
          saran: args.saran,
          telaah: args.telaah,
          kelengkapan: args.kelengkapan,
          satkerTujuan: args.satkerTujuan,
        })
        break
      case "submit": {
        result = await submitKeKabid({
          pengaduanId: args.pengaduanId,
          prepetratorId: args.prepetratorId,
          saran: args.saran,
          telaah: args.telaah ?? false,
          kelengkapan: args.kelengkapan ?? false,
          satkerTujuan: args.satkerTujuan,
        })
        if (result.success) {
          const supabase = createServiceClient()
          const { data: next } = await supabase
            .from("pengaduan")
            .select("id")
            .in("case_position", ["KASUBBAG YANDUAN POLDA JAWA BARAT", "OPERATOR YANDUAN POLDA JAWA BARAT"])
            .is("saran_kabid", null)
            .order("created_date", { ascending: true })
            .limit(1)
            .maybeSingle()
          result = { ...result, nextId: next?.id ?? null }
        }
        break
      }
      case "saran":
        result = await simpanSaranKabid({
          pengaduanId: args.pengaduanId,
          saran: args.saran,
          telaah: args.telaah,
          kelengkapan: args.kelengkapan,
          satkerTujuan: args.satkerTujuan,
        })
        break
      case "submit_kabid":
        result = await submitKeKabid({
          pengaduanId: args.pengaduanId,
          prepetratorId: args.prepetratorId,
          saran: args.saran,
          telaah: args.telaah,
          kelengkapan: args.kelengkapan,
          satkerTujuan: args.satkerTujuan,
        })
        break
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
