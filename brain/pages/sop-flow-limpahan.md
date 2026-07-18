---
id: sop-flow-limpahan
title: "SOP Flow Lidik→Pelimpahan (pain point: Gajamada melimpahkan pengaduan, bukan hasil lidik)"
category: concept
status: active
tags: [sop, flow, paminal, kabidpropam, penyidik, limpahan, gajamada-pain-point]
created: "2026-07-18T20:02:59"
updated: "2026-07-18T20:44:53"
---

## compiled_truth

## SOP flow asli (klarifikasi 2026-07-18)

```
[Aduan masuk Gajamada]
       ???
       ???
[Kasubbid Paminal: Mulai Lidik]  ?????? timeline entry: status=Laporan Diterima, case_position=PAMINAL
       ???
       ???
[Proses Lidik: Perencanaan ??? Pengumpulan BAKET ??? Pengolahan]
       ???
       ???
[Gelar Perkara] ??? hasil:
       ???
       ???????????? TERBUKTI ????????? [Upload Nota Dinas (LHP) di Tab Tindak Lanjut]
       ???                                            ???
       ???                                            ???
       ???                              [Paminal: case_position ??? KABIDPROPAM]
       ???                              ??? timeline entry: case_position=KABIDPROPAM,
       ???                                previous_case_position=PAMINAL
       ???                                            ???
       ???                                            ???
       ???                              [KABIDPROPAM: review LHP terlampir]
       ???                              ??? TIDAK melimpahkan ke unit tujuan langsung
       ???                              ??? disposisi balik ke KASUBBID PAMINAL
       ???                                  dengan catatan "limpahkan ke ..."
       ???                              ??? timeline entry: case_position=PAMINAL,
       ???                                previous_case_position=KABIDPROPAM
       ???                                            ???
       ???                                            ???
       ???                              [KASUBBID PAMINAL: terima disposisi balik]
       ???                              ??? unit_riwayat(PAMINAL:is_locked=false lagi)
       ???                              ??? eksekusi limpahan ke unit_X
       ???                              ??? timeline entry: case_position=unit_X,
       ???                                previous_case_position=PAMINAL
       ???                                            ???
       ???                                            ???
       ???                              [UNIT_X: mulai penyidikan]
       ???
       ???????????? TIDAK TERBUKTI ????????? [Sprin Henti Lidik + Pdt Ankum + SP2HP2]
                                                ???
                                                ???
                                        [selesai di Paminal ???
                                         case_position tetap PAMINAL,
                                         tidak ada serah-terima]
```

## Catatan koreksi

- Sebelumnya diagram salah: Paminal ??? Kabidpropam ??? Unit tujuan (2 hop).
- Sebenarnya **3 hop dengan 1 round-trip**:
  1. Paminal ??? Kabidpropam (kirim LHP)
  2. Kabidpropam ??? Paminal (disposisi balik dengan target)
  3. Paminal ??? Unit tujuan (limpahkan sesuai disposisi Kabidpropam)
- Kasubbid Paminal **bertindak 2x**: kirim LHP + limpahkan final.

## Implikasi ke unit_riwayat schema

Per kasus, jumlah row di unit_riwayat mengikuti jumlah satker unik yang singgah:
- Paminal ??? Kabidpropam ??? Paminal ??? Unit_X = **3 baris**: (PAMINAL, KABIDPROPAM, Unit_X).
- Baris Paminal: current_owner awalnya PAMINAL, jadi KABIDPROPAM, jadi PAMINAL lagi, jadi Unit_X. Tiap upsert menggantikan `last_event_*` & `current_owner`. `is_locked` toggle: true ??? false (round 2) ??? true (final).
- Baris Kabidpropam: current_owner terakhir adalah PAMINAL (setelah round-trip balik), jadi `is_locked=true` di Kabidpropam.
- Baris Unit_X: current_owner=Unit_X, is_locked=false.

## Apakah schema unit_riwayat masih cukup?

**YA, schema tetap cukup.** Alasan:

1. PK `(pengaduan_id, prepetrator_id, satker_key)` menghasilkan max 1 row per satker per kasus. Round-trip Paminal tetap 1 row (bukan 3). Yang berubah hanya value `last_event_*` & `is_locked` di row tersebut.
2. Tiap perpindahan `case_position` = 1 timeline entry dengan `previous_case_position` = posisi asal. `deriveUnitRiwayat` menghitung ulang satker_keys yang disentuh (`case_position ??? previous_case_position`) ??? upsert SEMUA satker yang muncul di history. Akurat.
3. `is_locked` reflect real-time per satker_key. Paminal saat round-trip balik akan auto `is_locked=false` lagi (karena `current_owner=PAMINAL`). Saat limpahkan final ??? `is_locked=true` lagi. Cocok dengan SOP.
4. Dashboard tab "Sudah Dilimpahkan" masih relevan: setelah Paminal limpahkan final, kasus tetap muncul di tab ini untuk tracking lintas-unit (read-only). Round-trip Paminal-Kabidpropam interim tetap tercatat di timeline detail (`timeline-card`/`detail-tabs`).

## Apa yang perlu ditambah (opsional)

Tambahan ringan untuk memperjelas cross-round-trip di unit_riwayat:

1. Kolom `event_count INTEGER` ??? jumlah event timeline yang melibatkan satker_key ini. Berguna untuk menandai satker yang punya history panjang (mis. Paminal yang round-trip).
2. Kolom `first_event_at TIMESTAMPTZ` ??? timestamp event pertama untuk satker ini, untuk sorting/aging.
3. Kolom `event_types TEXT[]` ??? daftar jenis event unik (mis. `['lhp_uploaded','limpahan','penugasan']`).

Ketiganya opsional; schema minimal saat ini (last_event_*) sudah menjawab "siapa pernah handle". Yang asked oleh user ??? "history via timeline" ??? sudah covered oleh `DetailTabs Timeline` yang pakai `getUnifiedTimeline` (existing).

## Jawaban langsung ke pertanyaan user

> "apakah flow awal sebenarnya sudah cukup? hanya ditambahkan history via timeline jadi satker/unit yang pernah menangani tidak kehilangan jejak?"

**YA.** Cukup:

- Schema `unit_riwayat` (1 tabel materialized) sudah cukup untuk round-trip 3-hop; tiap satker yang pernah singgah punya 1 row dengan `last_event_*`.
- Journey detail lintas-unit pakai timeline Gajamada langsung (existing) via `getUnifiedTimeline` di `TimelineCard`/`DetailTabs`.
- Tidak perlu tabel perjalanan_kasus/lhp_kabidpropam/disposisi_kabidpropam/penugasan_penyidik tambahan ??? derivable dari timeline + `previous_case_position`.
- Yang kita "tambah ke sejarah" adalah **cross-role/satker visibility** (dashboard tab + read-only enforcement), bukan schema baru.

## Catatan front-end (UI)

Untuk round-trip Paminal-Kabidpropam-Paminal, UI consideration:
- Saat `is_locked` Paminal toggles true ??? false ??? true (dari user experience),
  user Paminal akan melihat tombol Simpan enable/disable mengikuti siklus.
  Tidak ada perubahan kode tambahan ??? `isLocked` derived dari `case_position` di render-time.
- Bisa ditambahkan banner / activity log indicator ("Anda pernah mengirim ke Kabidpropam pada X, sekarang diterima kembali") untuk orientasi user. Tapi ini polishable enhancement, bukan blocker.

## FAQ edge case

- **Q: Paminal kirim LHP ke Kabid, Kabid disposisi balik ke Paminal, Paminal tidak segera limpahkan (delay) ??? bagaimana UI?**
  - A: `case_position=PAMINAL`, `is_locked=false`. Tombol Simpan enable. User normal bisa edit status/progress. OK.
- **Q: Paminal kirim LHP, Kabid disposisi balik, Paminal limpahkan ke Unit_X ??? data di Kabid apakah berubah status?**
  - A: Di Gajamada timeline ada 3 entry. Detil status di tiap row `timeline` reflects actual current. UI ambil dari timeline latest.
- **Q: Siapa owner di Paminal dashboard pada round-trip interim?**
  - A: tetap "Aktif" (case_position=PAMINAL setelah Kabid disposisi balik). Count tab "Sudah Dilimpahkan" mungkin transient berubah ??? itu OK.

## Status keputusan (revisi)

- [x] Schema `unit_riwayat` cukup untuk SOP round-trip 3-hop.
- [x] `is_locked` toggle otomatis via `current_owner`.
- [ ] Opsional: tambah `event_count`, `first_event_at`, `event_types` ke `unit_riwayat`.

## Referensi

- [[tindak-lanjut-tab]] ??? lokasi Simpan yang memicu perpindahan case_position.
- [[two-way-sync-gajamada]] ??? jalur inbound sync.
- [[gajamada-api-mutation-pattern]] ??? gateway `aa6159...` (case_position change) di sini tidak dipakai langsung; Paminal pakai Existing Terima/Teruskan.
- [[status-catalog]] ??? label status tiap phase.
- [[unit-catalog]] ??? daftar unit mapping.


## timeline

- time: 2026-07-18T20:02:59
  kind: decision
  summary: "Created this page: SOP Flow Lidik→Pelimpahan (pain point: Gajamada melimpahkan pengaduan, bukan hasil lidik)"
  source: "User request 2026-07-18 (brain update)"
  affects: [sop-flow-limpahan]

- time: 2026-07-18T20:03:19
  kind: decision
  summary: "Catat SOP asli + pain point Gajamada melimpahkan pengaduan bukan hasil lidik; susun 3 opsi (A visibility layer, B object model, C status hijack); rekomendasikan B"
  source: brain update-truth
  affects: [sop-flow-limpahan]

- time: 2026-07-18T20:10:36
  kind: decision
  summary: "Klarifikasi: limpahan Gajamada = ganti case_position saja (row tetap, Nota Dinas hanya attachment). Re-evaluasi: Opsi B sekarang tanpa gateway baru karena case_position change pakai gateway yang sudah dikenal (Teruskan/Override)"
  source: brain update-truth
  affects: [sop-flow-limpahan]

- time: 2026-07-18T20:12:27
  kind: decision
  summary: "User pilih Opsi B; tambah bagian tabel display: composite table unit_riwayat (materialized) + perjalanan_kasus events sebagai sumber"
  affects: [sop-flow-limpahan, tindak-lanjut-tab]

- time: 2026-07-18T20:12:51
  kind: decision
  summary: "Lock pemenang Opsi B dengan skema 5 tabel Supabase: perjalanan_kasus, lhp_kabidpropam, disposisi_kabidpropam, penugasan_penyidik, unit_riwayat (materialized via trigger)"
  source: brain update-truth
  affects: [sop-flow-limpahan]

- time: 2026-07-18T20:13:18
  kind: note
  summary: "User pertanyakan penggunaan Gajamada timeline yang sudah ada (previous_case_position, type, attachments) — kemungkinan menggantikan 4 tabel perjalanan_kasus/lhp/disposisi/penugasan. Perlu verifikasi struktur timeline Gajamada"
  affects: [sop-flow-limpahan, tindak-lanjut-tab]

- time: 2026-07-18T20:15:07
  kind: decision
  summary: "Sederhanakan schema: drop 4 tabel (perjalanan_kasus/lhp/disposisi/penugasan), tetap pakai timeline Gajamada, tambah unit_riwayat materialized saja + is_locked enforcement untuk read-only setelah serah-terima"
  source: brain update-truth
  affects: [sop-flow-limpahan]

- time: 2026-07-18T20:34:52
  kind: decision
  summary: "Implementasi Tahapan A selesai: unit_riwayat materialized + cascade derive di timeline-merge.ts + API GET /api/unit-riwayat + is_locked enforcement di aksi-paminal/distribusi/unit-proses + tab Aktif/Locked di dashboard unit + tab Menunggu/Sudah di Kabid dashboard"
  affects: [sop-flow-limpahan, tindak-lanjut-tab]

- time: 2026-07-18T20:44:07
  kind: reversal
  summary: "User koreksi SOP: Paminal -> Kabidpropam -> balik ke Paminal -> Paminal limpahkan ke Unit tujuan (3-step serah-terima, bukan 2-step)"
  source: User clarification 2026-07-18
  affects: [sop-flow-limpahan]

- time: 2026-07-18T20:44:53
  kind: decision
  summary: "Koreksi SOP round-trip 3-hop; konfirmasi schema unit_riwayat cukup"
  source: brain update-truth
  affects: [sop-flow-limpahan]
