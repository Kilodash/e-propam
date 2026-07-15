import { createServiceClient } from "@/lib/supabase/server"
import { fetchInfoDasar, fetchPelapor, fetchDataTerlapor, fetchBuktiPendukung } from "./client"

function toIso(v: any): string | null {
  if (!v) return null
  if (typeof v === "number") {
    try { return new Date(v).toISOString() } catch { return null }
  }
  if (typeof v === "string") {
    const n = Number(v)
    if (!isNaN(n) && n > 0) {
      try { return new Date(n).toISOString() } catch { return null }
    }
  }
  return null
}

export interface PengaduanDetailBundle {
  dasar: Record<string, any> | null
  pelapor: Record<string, any> | null
  terlapor: Record<string, any> | null
  bukti: Record<string, any>[]
}

export async function fetchPengaduanDetail(prepetratorId: string): Promise<PengaduanDetailBundle> {
  const [dasar, pelapor, terlapor, bukti] = await Promise.all([
    fetchInfoDasar(prepetratorId),
    fetchPelapor(prepetratorId),
    fetchDataTerlapor(prepetratorId),
    fetchBuktiPendukung(prepetratorId),
  ])
  return { dasar, pelapor, terlapor, bukti: bukti ?? [] }
}

export async function syncPengaduanDetail(pengaduanId: string, prepetratorId: string) {
  const supabase = createServiceClient()
  const detail = await fetchPengaduanDetail(prepetratorId)
  if (!detail.dasar) return { success: false, error: "Gagal mengambil detail dari Gajamada" }

  const d = detail.dasar
  const update: Record<string, any> = {
    updated_at: toIso(d.updated_at ?? d.latest_updated_at) ?? new Date().toISOString(),
  }
  if (d.id) update.id = d.id
  if (d.category) update.category = d.category
  if (d.sub_category) update.sub_category = d.sub_category
  if (d.source) update.source = d.source
  if (d.phone_no) update.phone_no = d.phone_no
  if (d.form_of_action) update.summary = d.form_of_action
  if (d.type_of_violation) update.content = d.type_of_violation
  if (d.organization_unit) update.alamat_kejadian = d.organization_unit
  if (d.detail_where) update.alamat_kejadian = d.detail_where
  if (d.polres) update.disposisi_polres = d.polres
  if (d.police_function) update.disposisi_police_function = d.police_function
  if (d.case_position) update.case_position = d.case_position
  if (d.polda) update.disposisi_polda = d.polda
  if (d.status) update.status_label = d.status
  if (d.sub_status) update.sub_status = d.sub_status
  if (d.created_date) {
    const iso = toIso(d.created_date)
    if (iso) update.created_date = iso
  }

  if (detail.pelapor) {
    const p = detail.pelapor
    if (p.sender_name) update.pengirim = p.sender_name
    if (p.reporter_nik) update.reporter_nik = p.reporter_nik
    if (p.email) update.email = p.email
    if (p.sender_address) update.pengirim_address = p.sender_address
  }

  if (detail.terlapor) {
    const t = detail.terlapor
    if (t.name) update.terlapor_name = t.name
    if (t.rank) update.terlapor_rank = t.rank
    if (t.position) update.terlapor_position = t.position
    if (t.identity_number) update.terlapor_nrp = t.identity_number
    if (t.division) update.terlapor_division = t.division
  }

  const { error } = await supabase.from("pengaduan").update(update).eq("id", pengaduanId)
  if (error) return { success: false, error: error.message }
  return { success: true, updated: Object.keys(update).length, bukti: detail.bukti.length }
}
