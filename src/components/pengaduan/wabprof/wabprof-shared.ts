export interface PelanggarWabprof {
  key: string
  prepetrator_id: string
  nama: string
  pangkat: string
  nrp: string
  jabatan: string
  kesatuan: string
  source: "paminal" | "provos" | "wabprof"
}

// Sanksi Etika (Kategori Ringan - Pasal 108 Perpol 7/2022)
export const SANKSI_ETIKA = [
  "Perilaku Pelanggar dinyatakan sebagai perbuatan tercela",
  "Kewajiban Pelanggar untuk meminta maaf secara lisan dihadapan Sidang KKEP dan secara tertulis kepada pimpinan Polri dan pihak yang dirugikan",
  "Kewajiban Pelanggar untuk mengikuti pembinaan rohani, mental dan pengetahuan profesi selama 1 (satu) bulan",
] as const

// Sanksi Administratif (Kategori Sedang & Berat - Pasal 109 Perpol 7/2022)
export const SANKSI_ADMINISTRATIF = [
  "Mutasi bersifat demosi paling singkat 1 (satu) tahun",
  "Penundaan kenaikan pangkat paling singkat 1 (satu) tahun dan paling lama 3 (tiga) tahun",
  "Penundaan pendidikan paling singkat 1 (satu) tahun dan paling lama 3 (tiga) tahun",
  "Penempatan pada Tempat Khusus paling lama 30 (tiga puluh) hari kerja",
  "Pemberhentian Tidak Dengan Hormat (PTDH) sebagai anggota Polri",
] as const

export const PUTUSAN_KKEP = [...SANKSI_ETIKA, ...SANKSI_ADMINISTRATIF] as const

export type PutusanKkepValue = typeof PUTUSAN_KKEP[number]

export interface SidangKkepEntry {
  key: string
  pelanggarKeys: string[]
  tempatSidang: string
  khdTanggal: string
  khdNomor: string
  khdFiles: File[]
  khdUploadedFiles: { url: string; file_name: string }[]
  khdSaving: boolean
  khdSaved: boolean
  khdSaveError?: boolean
  putusan: PutusanKkepValue[]
  catatan: string
  banding: boolean
  bandingTanggal: string
  bandingMemo: string
}

export function emptySidangKkepEntry(): SidangKkepEntry {
  return {
    key: crypto.randomUUID(),
    pelanggarKeys: [],
    tempatSidang: "",
    khdTanggal: "",
    khdNomor: "",
    khdFiles: [],
    khdUploadedFiles: [],
    khdSaving: false,
    khdSaved: false,
    khdSaveError: false,
    putusan: [],
    catatan: "",
    banding: false,
    bandingTanggal: "",
    bandingMemo: "",
  }
}
