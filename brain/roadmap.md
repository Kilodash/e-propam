---
slug: roadmap
title: Roadmap
role: milestones
updated: "2026-07-24T19:03:00"
---

# Roadmap

## Milestones

```mermaid
gantt
    title E-PROPAM Roadmap
    dateFormat  YYYY-MM
    section Tahap Awal
    Setup project & auth         :done, 2026-07, 2026-08
    Data model & sync            :done, 2026-08, 2026-10
    section Tahap Inti
    Yanduan workflow             :done, 2026-10, 2026-12
    Kabid review                 :done, 2026-12, 2027-01
    Unit tindaklanjut            :done, 2027-01, 2027-02
    Admin pages                  :done, 2027-02, 2027-04
    section Tahap Akhir
    Card Aksi configurable       :done, 2027-04, 2027-06
    Dashboard & filter           :done, 2027-03, 2027-04
    Auto-sync & Bukti proxy      :done, 2027-04, 2027-05
    Card Buat Laporan + Paminal  :done, 2027-05, 2027-06
    Gelar Perkara + Perdamaian   :done, 2027-06, 2027-06
    Identitas Pelanggar + Dokumen:done, 2027-06, 2027-07
    section Overhaul Units & Wabprof
    Multi-pelanggar tabbed layout:done, 2027-07, 2027-07
    Indicator dot tersimpan/gagal:done, 2027-07, 2027-07
    Card Provos & Sidang         :done, 2027-07, 2027-07
    Card Wabprof (tint kuning)   :done, 2027-07, 2027-07
    Admin template per fungsi    :done, 2027-07, 2027-07
    Coolify Deployment Fixes     :done, 2027-07, 2027-07
    section Production Bug Fixes
    sync_log sequence fix        :done, 2027-07, 2027-07
    Missing DB columns migration :done, 2027-07, 2027-07
    unit_mapping satker_level fix:done, 2027-07, 2027-07
    PostgREST schema reload      :done, 2027-07, 2027-07
    Hydration error fix          :done, 2027-07, 2027-07
    section Deferred
    Card Terima Aplikasi Lain    :pending, 2027-08, 2027-08
    Card Register Pengaduan      :pending, 2027-08, 2027-08
    Berkas Perkara               :pending, 2027-08, 2027-08
    Buku Register UI             :pending, 2027-09, 2027-09
```

## Keputusan Produksi (2026-07-24)

- `sync_log` menggunakan `serial` PK — sequence dapat tertinggal jika ada insert manual. Fix: `setval` ke MAX(id).
- Kolom `disposisi_submitted_at` (dan kolom workflow lain) belum ada di DB saat deploy → migration `015_add_missing_workflow_columns.sql`.
- `unit_mapping.satker_level` check constraint lama tidak mencakup `kabid/tabes/brimob/ditpolair` → constraint diperbarui.
- 11 row `unit_mapping` dengan `satker_level = NULL` menyebabkan `/api/units` 500 → di-fix via SQL.
- PostgREST schema cache perlu restart container `supabase-rest` setelah ALTER TABLE.
- React Hydration Error #418 terjadi di elemen yang render tanggal (timezone server vs browser) → fix dengan `suppressHydrationWarning`.
