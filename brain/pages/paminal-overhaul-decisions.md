---
id: paminal-overhaul-decisions
title: Keputusan Overhaul Card Aksi Paminal
category: decision
status: active
tags: [paminal, overhaul, status, tindak-lanjut, sync]
created: "2026-07-20T00:18:49"
updated: "2026-07-20T00:19:08"
---

## compiled_truth

## compiled_truth

### Status per Target Pelimpahan
- Provos: status = "Hasil Lidik Terbukti", pelimpahan ke UNIT PROVOS
- Wabprof: status = "Hasil Lidik Terbukti", pelimpahan ke SUBBID WABPROF
- Polres: status = "Hasil Lidik Terbukti", pelimpahan ke Polres - surat
- Satker Polda: nota_dinas

### Dokumen Pelimpahan
- Satker Polda: nota_dinas
- Polres/Brimob/Polair: surat
- 1 gateway call langsung kasubbid terima (aa6159ec)

### Tab Tindak Lanjut
- Tanpa checkbox - semua DocBlock penuh (tanggal, nomor, simpan/reset/upload)
- SP2HP2 = Pemberitahuan kepada Pelapor (pem_pelapor dihapus - duplikat)
- pem_ankum = Pemberitahuan ke Ankum (muncul 2x saat tidak_terbukti - difilter)
- Tidak_terbukti: sprin_henti + pem_ankum wajib
- Dokumen Opsional: Surat ke Mabes, STR Jukrah (tanpa checkbox)

### Tab Rekap
- Daftar dokumen tersimpan dari dokumen_perkara
- Tombol: Selesai & Kirim + Cetak + Salin (1 row)
- Konfirmasi dialog sebelum submit

### Pelanggar
- Tab selalu tampil (tidak perlu hasil=terbukti)
- Jenis Personel: Polri (NRP 8 digit) / PNS (NIP 18 digit)
- Pangkat dari catalog API, difilter jenis
- Fetch dari Gajamada via widget dataTerlapor + fallback pelanggar_paminal
- Sub Fungsi dihapus (tidak ada di widget)

### Card Tint
- Paminal: merah (danger)
- Provos: biru (default)
- Wabprof: hitam (dark)

### Template Baru
- sprin_provos: Sprin/{no}/{rom}/{thn}/{unit}
- dp3d: DP3D/{no}/{rom}/{thn}/{unit}
- bap: BAP/{no}/{rom}/{thn}/{unit}
- sprin_sidang: Sprin/{no}/{rom}/{thn}/{unit}
- notulen_sidang: Notulen/{no}/{rom}/{thn}/{unit}
- putusan_disiplin: Skep/{no}/{rom}/{thn}/{unit}

### Cookie Gajamada
- Validasi via /auth/validate sebelum setiap API call
- Expired -> re-login otomatis

### Sync Protection
- Cek in_progress sebelum sync baru
- Stale lock >30 menit di-clear
- Sync tidak overwrite status_label/case_position yang synced_at lebih baru

## timeline

- time: 2026-07-19T16:00:00
  kind: decision
  summary: Overhaul Paminal selesai - tab Tindak Lanjut docblock, Rekap dokumen list, pelanggar fetch Gajamada
  source: chat session


## timeline

- time: 2026-07-20T00:18:49
  kind: decision
  summary: "Created this page: Keputusan Overhaul Card Aksi Paminal"
  source: chat session 2026-07-19
  affects: [paminal-overhaul-decisions]

- time: 2026-07-20T00:19:08
  kind: decision
  summary: Complete Paminal overhaul decisions from 2026-07-19 session
  source: brain update-truth
  affects: [paminal-overhaul-decisions]
