---
id: status-catalog
title: "Katalog Status Gajamada — Pola & Pattern Rules"
category: reference
status: active
tags: [gajamada, status, pattern, categorize, catalog]
created: "2026-07-14T01:30:00"
updated: "2026-07-14T01:30:00"
---

## compiled_truth

Master referensi semua status_label Gajamada yang ditemukan. Sumber: HAR files (`data/management/get-all`). Digunakan untuk `categorizeStatus()` di `src/lib/status-category.ts`.

### Status Ditemukan di HAR

| status_label | Kategori E-PROPAM |
|---|---|
| Laporan Diterima | diterima |
| Laporan Diterima Polda | diterima |
| Laporan Dikirim ke Polda | dikirim |
| Laporan Dikirim ke Polres | dikirim |

### Pattern Rules di `status-category.ts`

```ts
export const RULES = [
  { pattern: /Diterima\b/i, category: "diterima" },
  { pattern: /Dikirim\b/i, category: "dikirim" },
  { pattern: /Lidik\b|Penyelidikan|Proses\s+Lidik|Gelar/i, category: "dalam_proses" },
  { pattern: /Selesai|Dihentikan|Arsip/i, category: "selesai" },
  { pattern: /Tolak|Ditolak/i, category: "ditolak" },
  { pattern: /Kembali|Dikembalikan/i, category: "dikembalikan" },
]
```

### Diagram Alur Status

```
Diterima → Dikirim ke Polda → Diterima Polda → [Disposisi]
                                              → Dikirim ke Polres → [Polres tindaklanjut]
                                                                  → Selesai / Terbukti
```

### Catatan
- Status dari Gajamada adalah **source of truth** — jangan dimodifikasi
- Kategorisasi di E-PROPAM hanya untuk display badge/ikon
- Status baru yang muncul di masa depan: tambahkan pattern ke `RULES[]` di `src/lib/status-category.ts`

## timeline

- time: 2026-07-14T01:30:00
  kind: creation
  summary: "Created status catalog from HAR extraction"
  source: "HAR: har/gajamada login dan tampil pengaduan.har"
  affects: [status-catalog, status-category, pattern-rules]
