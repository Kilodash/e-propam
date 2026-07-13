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
  pengirim: string | null
  phone_no: string | null
  email: string | null
  category: string | null
  content: string | null
  summary: string | null
  status_label: string | null
  case_position: string | null
  disposisi_polda: string | null
  disposisi_polres: string | null
  disposisi_police_function: string | null
  polda_code: number | null
  source: string | null
  source_alias: string | null
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
  attachments: { url: string; file_name: string; size?: number }[] | null
}

export interface Attachment {
  id: string
  pengaduan_id: string
  url: string
  file_name: string
  file_type: string
}

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
