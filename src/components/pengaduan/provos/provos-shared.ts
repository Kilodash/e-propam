export interface PelanggarProvos {
  key: string
  prepetrator_id: string
  nama: string
  pangkat: string
  nrp: string
  jabatan: string
  kesatuan: string
  source: "paminal" | "provos"
}

export const PUTUSAN_SIDANG = [
  "Teguran tertulis",
  "Penundaan mengikuti pendidikan paling lama 1 tahun",
  "Penundaan kenaikan gaji berkala",
  "Penundaan kenaikan pangkat paling lama 1 tahun",
  "Mutasi yang bersifat demosi",
  "Pembebasan dari jabatan",
  "Penempatan dalam tempat khusus paling lama 21 hari",
] as const

export type PutusanValue = typeof PUTUSAN_SIDANG[number]

export interface SidangEntry {
  key: string
  pelanggar: PelanggarProvos | null
  khdTanggal: string
  khdNomor: string
  khdFiles: File[]
  khdUploadedFiles: { url: string; file_name: string }[]
  khdSaving: boolean
  khdSaved: boolean
  putusan: PutusanValue[]
  patsusDiperberat: boolean
  banding: boolean
  bandingTanggal: string
  bandingMemo: string
}

export function emptySidangEntry(): SidangEntry {
  return {
    key: crypto.randomUUID(),
    pelanggar: null,
    khdTanggal: "",
    khdNomor: "",
    khdFiles: [],
    khdUploadedFiles: [],
    khdSaving: false,
    khdSaved: false,
    putusan: [],
    patsusDiperberat: false,
    banding: false,
    bandingTanggal: "",
    bandingMemo: "",
  }
}
