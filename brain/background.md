---
slug: background
title: Project background
role: project background
updated: "2026-07-15T20:46:43"
---

# Project background

## Why

Aplikasi monitoring pengaduan masyarakat dan tindaklanjutnya di Bidpropam Polda Jawa Barat. Aplikasi asli (Gajamada Propam ??? `gajamada-propam.polri.go.id`) platform eBdesk low-code dengan banyak kekurangan UI/UX, flow, dan fitur. E-PROPAM memperbaiki kelemahan tersebut melalui sinkronisasi dua arah dengan sistem sumber ??? data tetap di Gajamada, UI/UX dan workflow tambahan di E-PROPAM.

## Goals

- Interface monitoring pengaduan yang lebih baik, role-based
- Alur kerja (workflow) penerimaan, disposisi, distribusi, penyelidikan, dan tindaklanjut yang lebih terstruktur
- Pelacakan status pengaduan transparan di setiap level
- Sinkronisasi data dua arah dengan Gajamada Propam sebagai source of truth
- Card Aksi configurable per-role (DB-driven)
- Mendukung seluruh unit kerja di lingkungan Polda Jabar + Polres/Polresta

## Non-goals

- Pengaduan di luar wilayah Polda Jawa Barat
- Akses untuk masyarakat umum (aplikasi internal)
- Mengganti Gajamada sebagai sistem utama

## Target users

Seluruh pengguna adalah internal Polda Jawa Barat dengan peran hierarkis:

| Peran | Unit | Tanggung Jawab |
|-------|------|----------------|
| Admin | - | Manajemen sistem, unit/status mapping, card layout, user management |
| Kasubbag Yanduan | Operator Subbag Yanduan | Menerima surat, saran unit, submit ke Kabid |
| Kabid Propam | - | Review pengaduan, setujui/tolak, distribusi ke unit |
| Kasubbid Paminal | Subbid Paminal | Menerima surat, penyelidikan, proses |
| Kasubbid Provos | Subbid Provos | Menerima surat, proses pelanggaran disiplin |
| Kasubbid Wabprof | Subbid Wabprof | Menerima surat, proses pelanggaran kode etik |
| Kasubbag Rehabpers | Subbag Rehabpers | Menerima surat, proses pemutihan/rekomendasi |
| Seksipropam Polres | Polres/Polresta/Polrestabes, Satbrimob | Proses di tingkat Polres |
| Wassidik | Ditreskrimum/Sus/Narkoba/Siber/PPA/PPO | Pelimpahan penanganan pidana |

## Status Saat Ini (15 Juli 2026)

Semua milestone Tahap Awal dan Tahap Inti selesai. Aplikasi dalam tahap **Penyempurnaan & Polish** ??? pengujian end-to-end, bug fixing, dan penghalusan UI/UX.
