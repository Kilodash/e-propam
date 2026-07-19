export interface PelanggarItem {
  key: string
  prepetrator_id: string
  prepetrator_type: string
  prepetrator_description: string
  nama: string
  pangkat: string
  nrp: string
  jabatan: string
  kesatuan: string
  functional: string
  tempat_lahir: string
  tanggal_lahir: string
  telpon: string
  pendidikan: string
  jenis_kelamin: string
  wujud: string
  kategori: string
  sub_kategori: string
  pasal_disiplin: string[]
  pasal_kke: string[]
}

export interface CatalogOptions {
  value: string
  label: string
  category?: string
  sub_category?: string
  kategori?: string
  sub_kategori?: string
  type?: string
}

export type DocBlock = {
  tanggal: string
  nomor: string
  files: File[]
  uploadedFiles: { url: string; file_name: string }[]
  saving: boolean
  saved: boolean
}
export const emptyBlock = (): DocBlock => ({ tanggal: "", nomor: "", files: [], uploadedFiles: [], saving: false, saved: false })

export interface TindakLanjutItem {
  key: string
  label: string
  checked: boolean
  nomor: string
}

export type TindakLanjutTabProps = {
  hasil: string
  tlList: TindakLanjutItem[]
  pelanggarList: PelanggarItem[]
  pelimpahan: string
  unitOptions: { value: string; label: string }[]
  onToggleTl: (idx: number) => void
  onSetTlNomor: (idx: number, nomor: string) => void
  onSetPelimpahan: (v: string) => void
  copied: boolean
  onSalinRekap: () => Promise<void>
}

export type RekapTabProps = {
  stage: string
  hasil: string
  gelarTgl: string
  gelarNo: string
  tlList: TindakLanjutItem[]
  pelanggarList: PelanggarItem[]
  pelimpahan: string
  error: string | null
  success: string | null
  updateGajamada: boolean
  onToggleUpdate: (v: boolean) => void
  onSubmit: () => Promise<void>
  loading: boolean
  pengaduan: any
}

export const BASE_TABS = [
  { key: "proses_lidik" as const, label: "Proses Lidik" },
  { key: "pelaporan" as const, label: "Pelaporan" },
  { key: "tindak_lanjut" as const, label: "Tindak Lanjut" },
  { key: "rekap" as const, label: "Rekap" },
]

export const STAGES = [
  { value: "perencanaan", label: "Perencanaan" },
  { value: "pengumpulan", label: "Pengumpulan BAKET" },
  { value: "pengolahan", label: "Pengolahan" },
  { value: "pelaporan", label: "Pelaporan" },
]

export const STAGE_DOC_TYPES: Record<string, { value: string; label: string }[]> = {
  perencanaan: [
    { value: "pemberitahuan_awal", label: "Pemberitahuan Awal" },
    { value: "uuk", label: "UUK" },
    { value: "sprinlidik", label: "Sprinlidik" },
  ],
  pengumpulan: [],
  pengolahan: [
    { value: "notulen_gelar", label: "Notulen Gelar" },
  ],
  pelaporan: [
    { value: "lhp", label: "LHP" },
    { value: "nota_dinas", label: "Nota Dinas" },
  ],
}

export const PANGKAT_LIST = [
  "KOMBES POL", "AKBP", "KOMPOL", "AKP", "IPTU", "IPDA",
  "AIPTU", "AIPDA", "BRIPKA", "BRIGADIR", "BRIPTU", "BRIPDA",
  "ABRIP", "ABRIPTU", "ABRIPDA", "BHARAKA", "BHARATU", "BHARADA",
  "PENATA TK I", "PENATA", "PENATA MUDA TK I", "PENATA MUDA",
  "PENGATUR TK I", "PENGATUR", "PENGATUR MUDA TK I", "PENGATUR MUDA",
  "JURU TK I", "JURU", "JURU MUDA TK I", "JURU MUDA",
]

export const TINDAK_LANJUT: TindakLanjutItem[] = [
  { key: "sp2hp2", label: "SP2HP2", checked: true, nomor: "" },
  { key: "pem_pelapor", label: "Pemberitahuan ke Pelapor", checked: true, nomor: "" },
  { key: "pem_ankum", label: "Pemberitahuan ke Ankum", checked: false, nomor: "" },
]

export const SYARAT_MATERIIL = [
  { key: "tidak_keresahan", label: "Tidak menimbulkan keresahan dan penolakan dari masyarakat" },
  { key: "tidak_konflik", label: "Tidak berdampak konflik sosial" },
  { key: "pernyataan_tidak_keberatan", label: "Adanya pernyataan dari semua pihak untuk tidak keberatan" },
  { key: "prinsip_pembatas", label: "Memenuhi kriteria Prinsip pembatas" },
]

export const SYARAT_PEMBATAS = [
  { key: "kesalahan_ringan", label: "Tingkat kesalahan pelaku tidak berat (Mensrea)" },
  { key: "bukan_berulang", label: "Pelaku bukan anggota yang sering melakukan pelanggaran" },
]

export const SYARAT_FORMIL = [
  { key: "surat_permohonan", label: "Surat Permohonan Perdamaian dari kedua belah pihak" },
  { key: "surat_pernyataan", label: "Surat Pernyataan Perdamaian kedua belah pihak" },
  { key: "surat_pencabutan", label: "Surat Pencabutan Laporan oleh pelapor di atas meterai" },
  { key: "ba_pemeriksaan", label: "Berita acara pemeriksaan tambahan terhadap kedua belah pihak" },
]

export function validateTelpon(telpon: string): { valid: boolean; warning: string } {
  if (!telpon) return { valid: true, warning: "" }
  const clean = telpon.replace(/\D/g, "")
  if (clean.length < 10) return { valid: false, warning: "No. HP minimal 10 digit" }
  if (!clean.startsWith("0") && !clean.startsWith("62")) return { valid: false, warning: "No. HP harus diawali 0 atau 62" }
  return { valid: true, warning: "" }
}

export function validateNrp(nrp: string, tglLahir: string): { valid: boolean; warning: string } {
  if (!nrp) return { valid: true, warning: "" }
  const clean = nrp.replace(/\D/g, "")
  if (clean.length === 8) {
    const yy = parseInt(clean.slice(0, 2))
    const mm = parseInt(clean.slice(2, 4))
    if (mm < 1 || mm > 12) return { valid: false, warning: `NRP tidak valid: bulan ${mm} tidak ada (harus 01-12)` }
    if (tglLahir) {
      const d = new Date(tglLahir)
      if (!isNaN(d.getTime())) {
        const expectedYY = String(d.getFullYear()).slice(2)
        const expectedMM = String(d.getMonth() + 1).padStart(2, "0")
        if (clean.slice(0, 4) !== expectedYY + expectedMM) {
          const birthYear = d.getFullYear()
          const now = new Date().getFullYear()
          const age = now - birthYear
          if (age > 58) return { valid: false, warning: `Peringatan: usia ${age} tahun — sudah melewati batas pensiun (58 tahun)` }
          if (age < 18) return { valid: false, warning: `Peringatan: usia ${age} tahun — terlalu muda` }
          return { valid: false, warning: `NRP (${clean}) tidak sesuai tanggal lahir — seharusnya ${expectedYY}${expectedMM}XXXX` }
        }
      }
    }
    return { valid: true, warning: "" }
  }
  if (clean.length >= 16) {
    const y = parseInt(clean.slice(0, 4))
    const m = parseInt(clean.slice(4, 6))
    const d = parseInt(clean.slice(6, 8))
    if (m < 1 || m > 12) return { valid: false, warning: `NIP tidak valid: bulan ${m} tidak ada (harus 01-12)` }
    if (d < 1 || d > 31) return { valid: false, warning: `NIP tidak valid: tanggal ${d} tidak ada (harus 01-31)` }
    if (tglLahir && clean.length === 18) {
      const bd = new Date(tglLahir)
      if (!isNaN(bd.getTime())) {
        const ey = bd.getFullYear().toString()
        const em = String(bd.getMonth() + 1).padStart(2, "0")
        const ed = String(bd.getDate()).padStart(2, "0")
        if (clean.slice(0, 8) !== ey + em + ed) {
          return { valid: false, warning: `NIP tidak sesuai tanggal lahir — seharusnya ${ey}${em}${ed}XXXXXXXXXX` }
        }
      }
    }
    return { valid: true, warning: "" }
  }
  if (clean.length > 0) {
    return { valid: false, warning: `NRP/NIP harus 8 digit (Polri) atau 16/18 digit (PNS)` }
  }
  return { valid: true, warning: "" }
}

export const PELIMPAHAN_TARGETS: { value: string; label: string; statusLabel: string }[] = [
  { value: "UNIT PROVOS POLDA JAWA BARAT", label: "Provos", statusLabel: "LIMPAH KE UNIT PROVOS" },
  { value: "SUBBID WABPROF POLDA JAWA BARAT", label: "Wabprof", statusLabel: "LIMPAH SUBBIDAWBPROF" },
]
