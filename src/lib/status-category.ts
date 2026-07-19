export type StatusCategory =
  | "diterima"
  | "dikirim"
  | "dalam_proses"
  | "selesai"
  | "ditolak"
  | "dikembalikan"
  | "unknown";

export const RULES = [
  { pattern: /Diterima\b/i, category: "diterima" as StatusCategory },
  { pattern: /Dikirim\b/i, category: "dikirim" as StatusCategory },
  { pattern: /Lidik\b|Penyelidikan|Proses\s+Lidik|Gelar/i, category: "dalam_proses" as StatusCategory },
  { pattern: /Selesai|Dihentikan|Arsip|Perdamaian/i, category: "selesai" as StatusCategory },
  { pattern: /Tolak|Ditolak/i, category: "ditolak" as StatusCategory },
  { pattern: /Kembali|Dikembalikan/i, category: "dikembalikan" as StatusCategory },
];

export function categorizeStatus(status: string | null | undefined): { category: StatusCategory; label: string } {
  if (!status) return { category: "unknown", label: "Tidak Diketahui" };

  for (const rule of RULES) {
    if (rule.pattern.test(status)) {
      const label = /Restorative\s*Justice|Perdamaian/i.test(status) ? "Perdamaian" : status
      return { category: rule.category, label };
    }
  }

  return { category: "unknown", label: status };
}

export function getRules() {
  return RULES;
}

const DISPLAY_TO_GAJAMADA: Record<string, string> = {
  "Perdamaian": "Restorative Justice",
}

export function toGajamadaStatus(displayLabel: string): string {
  return DISPLAY_TO_GAJAMADA[displayLabel] ?? displayLabel
}
