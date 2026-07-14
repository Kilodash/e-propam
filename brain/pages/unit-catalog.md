---
id: unit-catalog
title: "Katalog Unit Gajamada — Nama & Mapping ke E-PROPAM"
category: reference
status: active
tags: [gajamada, unit, mapping, polda-jabar, catalog]
created: "2026-07-14T01:00:00"
updated: "2026-07-14T02:00:00"
---

## compiled_truth

Master referensi semua unit/posisi Gajamada POLDA JAWA BARAT.
Sumber: HAR `gajamada all pengaduan.har` + `permission/get-all` + `gateway/execute`.

Format nama Gajamada: `[JABATAN] [FUNGSI] [LOKASI] POLDA JAWA BARAT`
Format `normalized_name`: nama display di E-PROPAM.
Grouping: semua `gajamada_name` dengan `normalized_name` sama dikelompokkan via `groupUnitsByNormalizedName()`.

### Unit Seed Lengkap (Polda Jabar)

| gajamada_name | normalized_name | police_function | satker_level |
|---|---|---|---|
| KABID PROPAM POLDA JAWA BARAT | Kabid Propam | — | kabid |
| KASUBBAG YANDUAN POLDA JAWA BARAT | Subbag Yanduan | YANDUAN | subbag |
| OPERATOR YANDUAN POLDA JAWA BARAT | Subbag Yanduan | YANDUAN | subbag |
| KASUBBAG REHABPERS POLDA JAWA BARAT | Subbag Rehabpers | REHABPERS | subbag |
| KASUBBID PAMINAL POLDA JAWA BARAT | Subbid Paminal | PAMINAL | subbid |
| KAUR BINPAM SUBBID PAMINAL POLDA JAWA BARAT | Subbid Paminal | PAMINAL | subbid |
| UR BINPAM SUBBID PAMINAL POLDA JAWA BARAT | Subbid Paminal | PAMINAL | subbid |
| UR BINPAM SUBBID PAMINAL JAWA BARAT | Subbid Paminal | PAMINAL | subbid |
| UNIT 2 SUBBID PAMINAL POLDA JAWA BARAT | Subbid Paminal | PAMINAL | subbid |
| UNIT 3 SUBBID PAMINAL POLDA JAWA BARAT | Subbid Paminal | PAMINAL | subbid |
| KASUBBID PROVOS POLDA JAWA BARAT | Subbid Provos | PROVOS | subbid |
| KASUBBID WABPROF POLDA JAWA BARAT | Subbid Wabprof | WABPROF | subbid |
| KASIPROPAM POLRESTABES BANDUNG POLDA JAWA BARAT | Polrestabes Bandung | POLRES | tabes |
| KANIT PAMINAL POLRESTABES BANDUNG POLDA JAWA BARAT | Polrestabes Bandung | POLRES | tabes |
| KASIPROPAM POLRESTA BANDUNG POLDA JAWA BARAT | Polresta Bandung | POLRES | polres |
| KASIPROPAM POLRESTA BOGOR KOTA POLDA JAWA BARAT | Polresta Bogor Kota | POLRES | polres |
| KASIPROPAM POLRESTA CIREBON POLDA JAWA BARAT | Polresta Cirebon | POLRES | polres |
| KASIPROPAM POLRESTA KARAWANG POLDA JAWA BARAT | Polresta Karawang | POLRES | polres |
| KASIPROPAM POLRESTA SUKABUMI POLDA JAWA BARAT | Polresta Sukabumi | POLRES | polres |
| KASIPROPAM POLRES BANDUNG BARAT POLDA JAWA BARAT | Polres Cimahi | POLRES | polres |
| KASIPROPAM POLRES BANJAR POLDA JAWA BARAT | Polres Banjar | POLRES | polres |
| KANIT PAMINAL POLRES BANJAR KOTA POLDA JAWA BARAT | Polres Banjar | POLRES | polres |
| KASIPROPAM POLRES BOGOR POLDA JAWA BARAT | Polres Bogor | POLRES | polres |
| KAUR YANDUAN POLRES BOGOR POLDA JAWA BARAT | Polres Bogor | POLRES | polres |
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
| KASIPROPAM POLRES SUKABUMI KOTA POLDA JAWA BARAT | Polres Sukabumi Kota | POLRES | polres |
| KASIPROPAM POLRES SUMEDANG POLDA JAWA BARAT | Polres Sumedang | POLRES | polres |
| KASIPROPAM POLRES TASIKMALAYA POLDA JAWA BARAT | Polres Tasikmalaya | POLRES | polres |
| KASIPROPAM POLRES TASIKMALAYA KOTA POLDA JAWA BARAT | Polres Tasikmalaya Kota | POLRES | polres |
| KASIPROVOS SATBRIMOB POLDA JAWA BARAT | Satbrimob | PROVOS | brimob |
| KANIT PAMINAL DITPOLAIR POLDA JAWA BARAT | Ditpolair | POLAIR | ditpolair |
| WASSIDIK DITRESKRIMUM POLDA JAWA BARAT | Wassidik | WASSIDIK | wassidik |
| BAG WASSIDIK POLDA JAWA BARAT | Bag Wassidik | WASSIDIK | wassidik |

### Sub-unit Masih Kosong (dari HAR Nasional, belum muncul di Polda Jabar)

Sub-unit yang ada di data nasional tapi BELUM ada di Polda Jabar (perlu ditambahkan saat muncul):

**Subbid Provos:** UNIT 1 SUBBID PROVOS, UNIT 2 SUBBID PROVOS
**Subbid Wabprof:** TIM A SUBBID WABPROF, KASUBBID PERSIDANGAN SUBBID WABPROF
**Biro Paminal:** BAG BINPAM BIRO PAMINAL, DEN A BIRO PAMINAL, UNIT 1 DEN B BIRO PAMINAL
**Biro Provos:** UNIT RIKSA 1 BIRO PROVOS
**Biro Wabprof:** TIM A BIRO WABPROF
**Subbid Paminal:** UR LITPERS SUBBID PAMINAL, UR PRODOK SUBBID PAMINAL
**Yanduan:** KASUBAG TRIMLAP BAGYANDUAN

### Catatan

- Nama Jabatan prefix bervariasi: `KASIPROPAM`, `KANIT PAMINAL`, `KAUR YANDUAN`, `OPERATOR`, dll — semua valid
- Bug Gajamada: semua data masuk inbox `UR BINPAM SUBBID PAMINAL`, tapi `case_position` tetap mencatat posisi asal
- `UR BINPAM SUBBID PAMINAL JAWA BARAT` (tanpa "POLDA") adalah typo Gajamada

## timeline

- time: 2026-07-14T01:00:00
  kind: creation
  summary: "Created unit catalog from HAR extraction"
  source: "HAR: har/gajamada login dan tampil pengaduan.har, har/gajamada kasubbid terima.har"
  affects: [unit-catalog, seed, unit-mapping]

- time: 2026-07-14T02:00:00
  kind: update
  summary: "Added 13 Polda Jabar units from gajamada all pengaduan.har, including sub-units and alternative position names"
  source: "HAR: har/gajamada all pengaduan.har"
  affects: [unit-catalog, seed]
