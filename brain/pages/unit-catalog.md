---
id: unit-catalog
title: "Katalog Unit Gajamada — Nama & Mapping ke E-PROPAM"
category: reference
status: active
tags: [gajamada, unit, mapping, polda-jabar, catalog]
created: "2026-07-14T01:00:00"
updated: "2026-07-14T01:30:00"
---

## compiled_truth

Master referensi semua unit/posisi Gajamada yang ditemukan. Sumber: HAR files (`har/`) + `permission/get-all` + `data/management/get-all` + `gateway/execute`.

Format nama Gajamada: `[JABATAN] [FUNGSI] [LOKASI] POLDA JAWA BARAT`
Format `normalized_name`: nama display di E-PROPAM.

### Unit yang Sudah di Seed

| gajamada_name | normalized_name | police_function | satker_level |
|---|---|---|---|
| KABID PROPAM POLDA JAWA BARAT | Kabid Propam | — | kabid |
| KASUBBAG YANDUAN POLDA JAWA BARAT | Subbag Yanduan | YANDUAN | subbag |
| OPERATOR YANDUAN POLDA JAWA BARAT | Subbag Yanduan | YANDUAN | subbag |
| KASUBBAG REHABPERS POLDA JAWA BARAT | Subbag Rehabpers | REHABPERS | subbag |
| KASUBBID PAMINAL POLDA JAWA BARAT | Subbid Paminal | PAMINAL | subbid |
| KASUBBID PROVOS POLDA JAWA BARAT | Subbid Provos | PROVOS | subbid |
| KASUBBID WABPROF POLDA JAWA BARAT | Subbid Wabprof | WABPROF | subbid |
| KASIPROPAM POLRESTABES BANDUNG POLDA JAWA BARAT | Polrestabes Bandung | POLRES | tabes |
| KASIPROPAM POLRESTA BANDUNG POLDA JAWA BARAT | Polresta Bandung | POLRES | polres |
| KASIPROPAM POLRESTA BOGOR KOTA POLDA JAWA BARAT | Polresta Bogor Kota | POLRES | polres |
| KASIPROPAM POLRESTA CIREBON POLDA JAWA BARAT | Polresta Cirebon | POLRES | polres |
| KASIPROPAM POLRESTA KARAWANG POLDA JAWA BARAT | Polresta Karawang | POLRES | polres |
| KASIPROPAM POLRESTA SUKABUMI POLDA JAWA BARAT | Polresta Sukabumi | POLRES | polres |
| KASIPROPAM POLRES BANDUNG BARAT POLDA JAWA BARAT | Polres Cimahi | POLRES | polres |
| KASIPROPAM POLRES BANJAR POLDA JAWA BARAT | Polres Banjar | POLRES | polres |
| KASIPROPAM POLRES BOGOR POLDA JAWA BARAT | Polres Bogor | POLRES | polres |
| KANIT PAMINAL POLRES CIANJUR POLDA JAWA BARAT | Polres Cianjur | POLRES | polres |
| KASIPROPAM POLRES CIAMIS POLDA JAWA BARAT | Polres Ciamis | POLRES | polres |
| KANIT PAMINAL POLRES CIREBON KOTA POLDA JAWA BARAT | Polres Cirebon Kota | POLRES | polres |
| KASIPROPAM POLRES GARUT POLDA JAWA BARAT | Polres Garut | POLRES | polres |
| KASIPROPAM POLRES INDRAMAYU POLDA JAWA BARAT | Polres Indramayu | POLRES | polres |
| KASIPROPAM POLRES KUNINGAN POLDA JAWA BARAT | Polres Kuningan | POLRES | polres |
| KASIPROPAM POLRES MAJALENGKA POLDA JAWA BARAT | Polres Majalengka | POLRES | polres |
| KASIPROPAM POLRES PANGANDARAN POLDA JAWA BARAT | Polres Pangandaran | POLRES | polres |
| KASIPROPAM POLRES PURWAKARTA POLDA JAWA BARAT | Polres Purwakarta | POLRES | polres |
| KASIPROPAM POLRES SUBANG POLDA JAWA BARAT | Polres Subang | POLRES | polres |
| KASIPROPAM POLRES SUKABUMI POLDA JAWA BARAT | Polres Sukabumi | POLRES | polres |
| KASIPROPAM POLRES SUMEDANG POLDA JAWA BARAT | Polres Sumedang | POLRES | polres |
| KASIPROPAM POLRES TASIKMALAYA POLDA JAWA BARAT | Polres Tasikmalaya | POLRES | polres |
| KASIPROPAM POLRES TASIKMALAYA KOTA POLDA JAWA BARAT | Polres Tasikmalaya Kota | POLRES | polres |
| KASIPROVOS SATBRIMOB POLDA JAWA BARAT | Satbrimob | PROVOS | brimob |
| KANIT PAMINAL DITPOLAIR POLDA JAWA BARAT | Ditpolair | POLAIR | ditpolair |
| WASSIDIK DITRESKRIMUM POLDA JAWA BARAT | Wassidik | WASSIDIK | wassidik |

### Ditemukan di HAR — Belum di Seed

| gajamada_name (dari HAR) | Usulan normalized_name | Catatan |
|---|---|---|
| KANIT PAMINAL POLRES BOGOR POLDA JAWA BARAT | Polres Bogor | Nama beda dari seed `KASIPROPAM POLRES BOGOR` — mungkin ada dua posisi untuk polres yang sama |
| KANIT PAMINAL POLRES SUKABUMI POLDA JAWA BARAT | Polres Sukabumi | Sama seperti di atas |
| KAUR YANDUAN POLRESTA BANDUNG POLDA JAWA BARAT | Polresta Bandung | Unit Yanduan di tingkat Polresta |
| UNIT 2 SUBBID PAMINAL POLDA JAWA BARAT | Subbid Paminal | Sub-unit Paminal Polda |
| KAUR BINPAM SUBBID PAMINAL POLDA JAWA BARAT | Subbid Paminal | Sub-unit Paminal Polda (dari gateway/execute) |

### Sub-unit Polda — Struktur dari Permission Catalog

Dari `permission/get-all` (95 role), sub-unit yang ADA di struktur Gajamada:

**Subbid Paminal:**
- TIM UNIT SUBBID PAMINAL
- UR BINPAM SUBBID PAMINAL
- UR LITPERS SUBBID PAMINAL
- UR PRODOK SUBBID PAMINAL
- KAUR BINPAM SUBBID PAMINAL (sudah ditemukan di data)

**Subbid Provos:**
- TIM UNIT SUBBID PROVOS
- KAUR GAKKUM SUBBID PROVOS

**Subbid Wabprof:**
- TIM UNIT SUBBID WABPROF
- KAURGAK ETIKA SUBBID WABPROF POLDA

Format case_position di Gajamada **selalu** dengan suffix `POLDA JAWA BARAT` (untuk data Polda Jabar). Nama dari permission catalog di atas TANPA suffix — perlu ditambahkan suffix saat bikin seed.

## timeline

- time: 2026-07-14T01:00:00
  kind: creation
  summary: "Created unit catalog from HAR extraction"
  source: "HAR: har/gajamada login dan tampil pengaduan.har, har/gajamada kasubbid terima.har"
  affects: [unit-catalog, seed, unit-mapping]
