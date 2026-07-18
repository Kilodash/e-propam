---
slug: roadmap
title: Roadmap
role: milestones
updated: "2026-07-18T20:35:12"
---

# Roadmap

---
slug: roadmap
title: Roadmap
role: milestones
updated: "2026-07-18T12:00:00"
---

# Roadmap

## Milestones

`mermaid
gantt
    title E-PROPAM Roadmap
    dateFormat  YYYY-MM
    section Tahap Awal
    Setup project & auth         :done, 2026-07, 2026-08
    Data model & sync            :done, 2026-08, 2026-10
    section Tahap Inti
    Yanduan workflow (disposisi, saran) :done, 2026-10, 2026-12
    Kabid review (setujui/tolak)        :done, 2026-12, 2027-01
    Unit tindaklanjut (proses, selesai) :done, 2027-01, 2027-02
    Admin pages (unit/status mapping)   :done, 2027-02, 2027-04
    section Tahap Akhir
    Card Aksi (configurable per-role)   :done, 2027-04, 2027-06
    Dashboard & filter                  :done, 2027-03, 2027-04
    Auto-sync & Bukti proxy             :done, 2027-04, 2027-05
    SOP Flow Limpahan (Tahapan A)       :done, 2027-07, 2027-07
    Penyempurnaan & polish              :active, 2027-06, 2027-07
`

## Status Saat Ini (18 Juli 2026)

| Area | Status |
|------|--------|
| Auth & Role (RBAC) | done |
| Sync inbound (Gajamada ? Supabase) | done |
| Yanduan dashboard + disposisi | done |
| Kabid dashboard + pengaduan detail | done |
| Unit dashboard + filter multi-checklist | done |
| Card Aksi (DB-driven, configurable per-role, 9 cards) | done |
| Card Distribusi (ceklis disposisi, scope toggle) | done |
| Card Override + Status (searchable combobox) | done |
| Card Unit Proses (mulai/progress/selesai + Gajamada sync) | done |
| Card Kembalikan (target configurable) | done |
| Admin card-layout (table format, enable/disable, reorder) | done |
| Admin unit-mapping (CRUD, inline edit) | done |
| Timeline unified (Gajamada + catatan lokal + cascade unit_riwayat) | done |
| Bukti Pendukung (view/download/download all) | done |
| Searchable combobox (SearchableSelect component) | done |
| Scope toggle (KASUBBID/Semua unit) | done |
| Role-based data access (scope filtering) | done |
| Reporter count (NIK-based, Polda Jabar + Nasional) | done |
| Auto-sync (stale >1 jam) | done |
| Theme (compact padding) | done |
| AGENTS.md + AI rules | done |
| Card Buat Laporan (Lapinfo/LP-A) ? internal report creation | done |
| Card Proses 4-Stage Paminal (SOP-based: Perencanaan?Pengumpulan?Pengolahan?Pelaporan) | done |
| Gelar Perkara (tanggal + notulen) | done |
| Perdamaian (Syarat Materiil/Formil/Pembatas) | done |
| Identitas Pelanggar (Terbukti) | done |
| File upload dokumen (Supabase Storage) | done |
| DocTemplateInput ? reusable template nomor + upload | done |
| Buku Register ? sequential numbering per unit/type/year | done |
| Dokumen Perkara ? document tracking per pengaduan | done |
| NRP/NIP validation (8 digit Polri / 16-18 digit PNS + tanggal lahir + usia) | done |
| Telpon validation (awalan 0/62, min 10 digit) | done |
| Pendidikan Polri vs Umum (Gajamada catalog match) | done |
| Sub Fungsi + Jenis Personel + Keterangan Tambahan (HAR field parity) | done |
| Upload terduga pelanggar ke Gajamada (save_pelanggar action, ID-based pasal) | done |
| Dev Unit Selector (navbar) | done |
| Cetak Lembar Informasi (Dasar, Pelapor, Terlapor, Timeline + logo + page break) | done |
| Status display mapping (Restorative Justice ? Perdamaian) | done |
| Unit filter combobox (hide for non-leadership, show count) | done |
| Dokumen Upload deduplication (merge local + rekap by URL) | done |
| Reset button preserves uploaded files | done |
| Superpowers + brain skills installed | done |
| Tabel unit_riwayat (per-unit materialized summary) | done |
| Cascade derive unit_riwayat di timeline-merge.ts | done |
| API GET /api/unit-riwayat (satker/locked filter) | done |
| is_locked enforcement di aksi-paminal/distribusi/unit-proses | done |
| Per-unit dashboard tab Aktif/Sudah Dilimpahkan | done |
| Kabid dashboard tab Menunggu Disposisi/Sudah Didisposisi | done |

## Deferred

| Area | Status |
|------|--------|
| Card Terima Aplikasi Lain (Kabid) | pending |
| Card Register Pengaduan (Yanduan) | pending |
| Card Proses Provos (4-stage sidang disiplin) | pending |
| Card Proses Wabprof (4-stage sidang KKEP) | pending |
| Berkas Perkara (grouping multi-pengaduan) | pending |
| Buku Register UI (admin read-only view) | pending |
| Audit lintas-unit (filter rentang waktu + lintas satker) | pending |
| Backfill unit_riwayat dari timeline Gajamada history (lama) | pending |
| Doc template konfigurasi untuk Limpahan + Ankum (polda/non-polda policy) | pending |
