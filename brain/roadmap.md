---
slug: roadmap
title: Roadmap
role: milestones
updated: "2026-07-14T00:50:00"
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
    Admin pages (unit/status mapping)   :active, 2027-02, 2027-04
    section Tahap Akhir
    Dashboard & filter (searchKey)      :done, 2027-03, 2027-04
    Auto-sync & CDN proxy               :done, 2027-04, 2027-05
    Penyempurnaan & polish              :active, 2027-05, 2027-07
```

## Status Saat Ini (14 Juli 2026)

| Area | Status |
|------|--------|
| Auth & Role | done |
| Sync inbound (Gajamada → Supabase) | done |
| Yanduan dashboard + disposisi | done |
| Kabid review + approve/reject | done |
| Unit tindaklanjut (mulai/progress/selesai) | done |
| Admin unit-mapping (CRUD, inline edit) | done |
| Admin status-mapping | active |
| Auto-sync (stale >1 jam) | done |
| CDN proxy for bukti | done |
| Theme (dark cards) | done |
| AGENTS.md + AI rules | done |
