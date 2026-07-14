import { createServiceClient } from "@/lib/supabase/server"
import { executeGajamadaGateway, GATEWAY_KASUBBID_TERIMA } from "./gateway"
import { cookies } from "next/headers"

const DASHBOARD_ID = "1769155096865"

const VALID_UNITS = [
  "KASUBBAG YANDUAN POLDA JAWA BARAT",
  "OPERATOR YANDUAN POLDA JAWA BARAT",
  "KASUBBID PAMINAL POLDA JAWA BARAT",
  "UNIT 1 SUBBID PAMINAL POLDA JAWA BARAT",
  "UNIT 2 SUBBID PAMINAL POLDA JAWA BARAT",
  "KASUBBID PROVOS POLDA JAWA BARAT",
  "KASUBBID WABPROF POLDA JAWA BARAT",
  "KASUBBAG REHABPERS POLDA JAWA BARAT",
]

export type ActionResult =
  | { success: true; message: string; data?: unknown }
  | { success: false; error: string }

async function getActor(): Promise<{ name: string }> {
  const c = await cookies()
  const user = c.get("dev-user")?.value ?? "Unknown"
  return { name: user }
}

async function getCookie(): Promise<string | undefined> {
  const c = await cookies()
  return c.get("gajamada-cookie")?.value || process.env.GAJAMADA_SESSION_COOKIE
}

// ============================================================================
// OVERRIDE DISTRIBUSI — Yanduan langsung disposisi ke unit tanpa lewat Kabid
// ============================================================================
export async function overrideDistribusi(args: {
  pengaduanId: string
  prepetratorId: string
  targetUnit: string
  alasan: string
}): Promise<ActionResult> {
  if (!VALID_UNITS.includes(args.targetUnit)) {
    return { success: false, error: `Unit tidak valid: ${args.targetUnit}` }
  }
  if (!args.alasan.trim()) {
    return { success: false, error: "Alasan override wajib diisi" }
  }

  const actor = await getActor()
  const cookie = await getCookie()
  const supabase = createServiceClient()

  // Call Gajamada via the Kasubbid Terima gateway — set status + case_position directly
  const gatewayResult = await executeGajamadaGateway({
    gatewayId: GATEWAY_KASUBBID_TERIMA,
    cookie,
    userId: process.env.GAJAMADA_USER_ID,
    widgetId: "epropam-override",
    widgetName: "E-PROPAM Override Distribusi",
    params: {
      report_id: args.prepetratorId,
      note: `OVERRIDE DISTRIBUSI OLEH YANDUAN — ${args.alasan}`,
      createdBy: actor.name,
      case_handover: "",
      status: `Laporan Dikirim ke ${args.targetUnit}`,
      case_position: args.targetUnit,
    },
  })

  // Update E-PROPAM cache with override fields
  await supabase.from("pengaduan").update({
    override_unit: args.targetUnit,
    override_alasan: args.alasan,
    override_at: new Date().toISOString(),
    override_by: actor.name,
    case_position: args.targetUnit,
    status_label: `Laporan Dikirim ke ${args.targetUnit}`,
    synced_at: new Date().toISOString(),
  }).eq("id", args.pengaduanId)

  return {
    success: true,
    message: `Override distribusi ke ${args.targetUnit} berhasil`,
    data: gatewayResult.data.response.data,
  }
}

// ============================================================================
// PENGEMBALIAN KE MABES (Divpropam Polri) — kembalikan laporan ke pusat
// ============================================================================
export async function kembalikanKeMabes(args: {
  pengaduanId: string
  prepetratorId: string
  alasan: string
}): Promise<ActionResult> {
  if (!args.alasan.trim()) {
    return { success: false, error: "Alasan pengembalian wajib diisi" }
  }

  const actor = await getActor()
  const cookie = await getCookie()
  const supabase = createServiceClient()

  const gatewayResult = await executeGajamadaGateway({
    gatewayId: GATEWAY_KASUBBID_TERIMA,
    cookie,
    userId: process.env.GAJAMADA_USER_ID,
    widgetId: "epropam-kembalikan",
    widgetName: "E-PROPAM Pengembalian ke Mabes",
    params: {
      report_id: args.prepetratorId,
      note: `DIKEMBALIKAN KE DIVPROPAM POLRI — ${args.alasan}`,
      createdBy: actor.name,
      case_handover: "",
      status: "Laporan Ditolak",
      case_position: "DIVPROPAM POLRI",
    },
  })

  await supabase.from("pengaduan").update({
    kembalikan_alasan: args.alasan,
    kembalikan_at: new Date().toISOString(),
    kembalikan_by: actor.name,
    case_position: "DIVPROPAM POLRI",
    status_label: "Laporan Ditolak",
    synced_at: new Date().toISOString(),
  }).eq("id", args.pengaduanId)

  return {
    success: true,
    message: "Laporan dikembalikan ke Divpropam Polri",
    data: gatewayResult.data.response.data,
  }
}

// ============================================================================
// SARAN KE KABID — local only, no Gajamada call
// ============================================================================
export async function simpanSaranKabid(args: {
  pengaduanId: string
  saran: string
  telaah?: boolean
  kelengkapan?: boolean
  satkerTujuan?: string
}): Promise<ActionResult> {
  if (!args.saran.trim()) {
    return { success: false, error: "Saran wajib diisi" }
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()
  
  const update: Record<string, any> = {
    saran_kabid: args.saran,
    updated_at: now,
  }
  if (args.telaah !== undefined) {
    update.telaah = args.telaah
    update.telaah_at = args.telaah ? now : null
  }
  if (args.kelengkapan !== undefined) {
    update.kelengkapan = args.kelengkapan
    update.kelengkapan_at = args.kelengkapan ? now : null
  }
  if (args.satkerTujuan !== undefined) {
    update.disposisi_satker_tujuan = args.satkerTujuan || null
    update.disposisi_satker_at = args.satkerTujuan ? now : null
  }

  await supabase.from("pengaduan").update(update).eq("id", args.pengaduanId)

  return { success: true, message: "Saran ke Kabid tersimpan" }
}

export async function submitKeKabid(args: {
  pengaduanId: string
  prepetratorId: string
  saran: string
  telaah?: boolean
  kelengkapan?: boolean
  satkerTujuan?: string
}): Promise<ActionResult> {
  if (!args.saran.trim()) {
    return { success: false, error: "Saran wajib diisi" }
  }
  if (!args.telaah || !args.kelengkapan) {
    return { success: false, error: "Lengkapi checklist penelaahan dan kelengkapan" }
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()
  const actor = await getActor()
  const cookie = await getCookie()

  const casePosition = "KABID PROPAM POLDA JAWA BARAT"
  const status = "Laporan Diterima"

  // Call Gajamada — update status + case_position + timeline
  await executeGajamadaGateway({
    gatewayId: GATEWAY_KASUBBID_TERIMA,
    cookie,
    userId: process.env.GAJAMADA_USER_ID,
    widgetId: "epropam-submit-kabid",
    widgetName: "E-PROPAM Submit ke Kabid",
    params: {
      report_id: args.prepetratorId,
      note: `DISPOSISI YANDUAN KE KABID — ${args.saran}`,
      createdBy: actor.name,
      case_handover: "",
      status,
      case_position: casePosition,
    },
  })

  // Update E-PROPAM cache
  const update: Record<string, any> = {
    saran_kabid: args.saran,
    telaah: args.telaah,
    telaah_at: now,
    kelengkapan: args.kelengkapan,
    kelengkapan_at: now,
    disposisi_satker_tujuan: args.satkerTujuan || null,
    disposisi_satker_at: args.satkerTujuan ? now : null,
    disposisi_submitted_at: now,
    disposisi_submitted_by: actor.name,
    case_position: casePosition,
    status_label: status,
    synced_at: now,
    updated_at: now,
  }

  await supabase.from("pengaduan").update(update).eq("id", args.pengaduanId)

  return { success: true, message: "Disposisi dikirim ke Kabid Propam" }
}

export { VALID_UNITS }
