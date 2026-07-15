export type UserRole =
  | "admin"
  | "yanduan"
  | "kabid"
  | "paminal"
  | "provos"
  | "wabprof"
  | "rehabpers"
  | "polres"
  | "wassidik"

export interface User {
  id: string
  email: string
  role: UserRole
  unit_name: string | null
  polda_code: number
}

export interface Pengaduan {
  id: string
  prepetrator_id: string
  prepetrator_name: string | null
  pengirim: string | null
  pengirim_address: string | null
  phone_no: string | null
  email: string | null
  category: string | null
  sub_category: string | null
  content: string | null
  summary: string | null
  status_label: string | null
  sub_status: string | null
  case_position: string | null
  previous_case_position: string | null
  disposisi_polda: string | null
  disposisi_polres: string | null
  disposisi_police_function: string | null
  polda_code: number | null
  source: string | null
  source_alias: string | null
  reporter_nik: string | null
  alamat_kejadian: string | null
  tgl_kejadian: string | null
  terlapor_name: string | null
  terlapor_rank: string | null
  terlapor_position: string | null
  terlapor_nrp: string | null
  terlapor_division: string | null
  saran_kabid: string | null
  telaah: boolean | null
  telaah_at: string | null
  kelengkapan: boolean | null
  kelengkapan_at: string | null
  disposisi_satker_tujuan: string | null
  disposisi_satker_at: string | null
  disposisi_submitted_at: string | null
  disposisi_submitted_by: string | null
  kabid_approval_status: string | null
  kabid_approved_at: string | null
  kabid_approved_by: string | null
  kabid_catatan: string | null
  kabid_rejected_reason: string | null
  unit_status: string | null
  unit_progress: string | null
  unit_started_at: string | null
  unit_completed_at: string | null
  unit_officer: string | null
  override_unit: string | null
  override_alasan: string | null
  override_at: string | null
  override_by: string | null
  kembalikan_alasan: string | null
  kembalikan_at: string | null
  kembalikan_by: string | null
  created_date: string | null
  updated_at: string | null
  synced_at: string | null
}

export interface TimelineEntry {
  id: string
  prepetrator_id: string
  status: string | null
  status_alias: string | null
  case_position: string | null
  date_activity: string | null
  handling_progress: string | null
  officer_name: string | null
  subject: string | null
  previous_case_position: string | null
  type: string | null
  attachments: { url: string; file_name: string; size?: number }[] | null
}

export interface Attachment {
  id: string
  pengaduan_id: string
  url: string
  file_name: string
  file_type: string
}

export interface Catatan {
  id: string
  pengaduan_id: string
  prepetrator_id: string
  author_email: string
  author_role: string
  content: string
  created_at: string
}

export type TimelineItem =
  | { kind: "gajamada"; date: string; entry: TimelineEntry }
  | { kind: "catatan"; date: string; entry: Catatan }

export interface UnitMapping {
  id: number
  gajamada_name: string
  normalized_name: string
  police_function: string | null
  satker_level: string | null
}

export interface SyncStatus {
  last_sync: string | null
  in_progress: boolean
  total_records: number
  error: string | null
}
