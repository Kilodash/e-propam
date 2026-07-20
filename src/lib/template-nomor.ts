import { toRoman } from "./roman-month"

export const DOC_TEMPLATES: Record<string, string> = {
  lapinfo: "R/LI/{no}/{rom}/{thn}/{unit}",
  lp_a: "LP/{no}/{rom}/HUK.12.10./{thn}",
  sprinlidik: "Sprinlidik/{no}/{rom}/{thn}/{unit}",
  uuk: "Ropamina/{no}/{rom}/{thn}/{unit}",
  pemberitahuan_awal: "B/{no}/{rom}/WAS.2.4.{thn}/{unit}",
  renbut: "Renbut/{no}/{rom}/{thn}/{unit}",
  ba_interogasi: "BA/{no}/{rom}/{thn}/{unit}",
  und_klarifikasi: "Und/{no}/{rom}/{thn}/{unit}",
  lhp: "R/LHP/{no}/{rom}/{thn}/{unit}",
  nota_dinas: "B/ND/{no}/{rom}/{thn}/{unit}",
  notulen_gelar: "Notulen/{no}/{rom}/{thn}/{unit}",
  pem_pelapor: "B/{no}/{rom}/{thn}/{unit}",
  pem_ankum: "B/{no}/{rom}/{thn}/{unit}",
  surat: "R/{no}/{rom}/{thn}/{unit}",
  sprin_henti: "Sprinhenti/{no}/{rom}/{thn}/{unit}",
  str_jukrah: "STR/{no}/{rom}/{thn}/{unit}",
  sp2hp2: "B/{no}/{rom}/{thn}/{unit}",
  sprin_provos: "Sprin/{no}/{rom}/{thn}/{unit}",
  dp3d: "DP3D-{no}/K/{rom}/HUK.12.10./{thn}/{unit}",
  bap: "BAP/{no}/{rom}/{thn}/{unit}",
  sprin_sidang: "Sprin/{no}/{rom}/{thn}/{unit}",
  notulen_sidang: "Notulen/{no}/{rom}/{thn}/{unit}",
  putusan_disiplin: "Skep/{no}/{rom}/{thn}/{unit}",
  gelar_provos: "Notulen/{no}/{rom}/HUK.12.10./{thn}/{unit}",
  sprin_riksa: "Sprin.Riksa/{no}/{rom}/HUK.12.10./{thn}",
  khd: "KHD/{no}/{rom}/HUK.12.10./{thn}/{unit}",
}

export function buildNomor(
  docType: string,
  nomorUrut: number | string,
  bulan: number,
  tahun: number | string,
  unit: string,
  customTemplates?: Record<string, string>
): string {
  const template = (customTemplates && customTemplates[docType]) ?? DOC_TEMPLATES[docType] ?? "{no}/{rom}/{thn}/{unit}"
  return template
    .replace("{no}", String(nomorUrut))
    .replace("{rom}", toRoman(bulan))
    .replace("{thn}", String(tahun))
    .replace("{unit}", unit)
}
