---
slug: roadmap
title: Roadmap
role: milestones
updated: "2026-07-15T02:00:00"
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
    Yanduan workflow (disposisi, saran) :done, 2026-10, 2026-12
    Kabid review (setujui/tolak)        :done, 2026-12, 2027-01
    Unit tindaklanjut (proses, selesai) :done, 2027-01, 2027-02
    Admin pages (unit/status mapping)   :done, 2027-02, 2027-04
    section Tahap Akhir
    Card Aksi (configurable per-role)   :done, 2027-04, 2027-06
    Dashboard & filter                  :done, 2027-03, 2027-04
    Auto-sync & Bukti proxy             :done, 2027-04, 2027-05
    Penyempurnaan & polish              :active, 2027-06, 2027-07
```

## Status Saat Ini (15 Juli 2026)

| Area | Status |
|------|--------|
| Auth & Role (RBAC) | done |
| Sync inbound (Gajamada → Supabase) | done |
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
| Timeline unified (Gajamada + catatan lokal) | done |
| Bukti Pendukung (view/download/download all) | done |
| Searchable combobox (SearchableSelect component) | done |
| Scope toggle (KASUBBID/Semua unit) | done |
| Role-based data access (scope filtering) | done |
| Reporter count (NIK-based, Polda Jabar + Nasional) | done |
| Auto-sync (stale >1 jam) | done |
| Theme (compact padding) | done |
| AGENTS.md + AI rules | done |
