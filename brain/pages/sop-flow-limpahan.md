---
id: sop-flow-limpahan
title: "SOP Flow Lidik→Pelimpahan (pain point: Gajamada melimpahkan pengaduan, bukan hasil lidik)"
category: concept
status: active
tags: [sop, flow, paminal, kabidpropam, penyidik, limpahan, gajamada-pain-point]
created: "2026-07-18T20:02:59"
updated: "2026-07-18T20:34:52"
---

## compiled_truth

## Keputusan (diperbarui 2026-07-18)

**Opsi B dengan irisan lebih ramping**: pakai timeline Gajamada (sumber kebenaran lintas-unit), tambah unit_riwayat (materialized) untuk query dashboard per-unit, **drop 4 tabel perjalanan kasus** yang sebelumnya dirancang.

## Prinsip kunci

1. **Gajamada timeline = sumber kebenaran**?bukan perjalanan_kasus Supabase.
2. **Unit/satker asal bisa track perkembangan** lintas unit lewat timeline (read-only untuk event yang sudah diserah-terimakan).
3. **Tidak boleh lagi mengubah data** setelah serah-terima ? enforced di UI: tombol edit/simpan disable bila case_position != current_user_unit.
4. **Cukup timeline** (berdasarkan konfirmasi user 2026-07-18) ? tidak perlu mirror tables tambahan untuk LHP/disposisi/penugasan.

## Tabel baru (final)

### Hanya: unit_riwayat ? materialized view/table per satker

| Column | Type | Catatan |
|---|---|---|
| id | uuid PK | |
| pengaduan_id | text | FK |
| prepetrator_id | text | FK |
| satker_key | text | unit pencatat (PAMINAL / KABIDPROPAM / unit tujuan) |
| current_owner | text | mirror case_position Gajamada (sumber kebenaran) |
| is_locked | bool | computed: current_owner != satker_key ? read-only di sisi satker_key ini |
| last_event_type | text | event_type terakhir dari Gajamada timeline |
| last_event_nomor | text nullable | nomor dokumen event terakhir |
| last_event_at | timestamptz | timestamp event terakhir |
| last_status | text nullable | status terakhir (from Gajamada status/status_alias) |
| status | text | enum derived: ktif / menunggu_disposisi / dalam_penyidikan / selesai |
| tt_count | int | jumlah attachment |
| created_at, updated_at | timestamptz | standard |

PK: (pengaduan_id, prepetrator_id, satker_key).

## Cara kerja

### Sinkronisasi inbound (existing ? [[two-way-sync-gajamada]])
- Widget timeline 7761377d7802b8a2f07e200d8cde526b ? fetch entries dengan field: status, status_alias, case_position, **previous_case_position**, 	ype, officer_name, subject, ttachments, date_activity. Sudah dipakai oleh getTimelineFromGajamada (src/lib/gajamada/timeline.ts:4).
- Setelah fetch, upsert ke tabel lokal 	imeline (Supabase) ? sudah ada, fallback offline (src/lib/timeline-merge.ts:37).

### Trigger auto-update unit_riwayat
- Tiap sync inbound (insert/update ke 	imeline lokal), derive row untuk setiap satker yang punya jejak. Logikanya:
  - satker_key = previous_case_position (event out dari satker ini) ? upsert row di satker itu.
  - satker_key = case_position (event masuk ke satker ini) ? upsert row di satker itu.
  - Kalau current_owner != satker_key ? set is_locked=true.
- Bisa backend trigger di Supabase ATAU derivasi on-the-fly di API route (lebih ringan schema).

### Dashboard per-unit view

**Paminal dashboard** (satker_key=PAMINAL):
`
SELECT * FROM unit_riwayat 
WHERE satker_key='PAMINAL' 
ORDER BY last_event_at DESC

Tab UI:
  ? \"Aktif\"       ? current_owner mengandung PAMINAL & is_locked=false (masih bisa edit/simpan)
  ? \"Sudah Dilimpahkan\" ? is_locked=true (read-only timeline)
`

**Kabidpropam dashboard** (satker_key=KABIDPROPAM):
`
  ? \"Menunggu Disposisi\"  ? current_owner=KABIDPROPAM & is_locked=false
  ? \"Sudah Didisposisi\"   ? is_locked=true (read-only perjalanan)
`

**Unit tujuan dashboard** (existing atau ditambah):
`
  ? \"Untuk Penyidikan\"  ? current_owner=unit_tujuan & is_locked=false
  ? \"Selesai\"           ? is_locked=true + status=selesai
`

## Enforce \"tidak bisa lagi mengubah data\"

Di komponen tempat aksi mutation (Simpan/Selesai/dll):
- Cek: unit_riwayat.is_locked === true ? render tombol disabled + tooltip \"Kasus sudah diserah-terimakan ke {current_owner}, hubungi unit tujuan untuk perubahan\".
- Berlaku di [[tindak-lanjut-tab]] (Simpan Pelimpahan, Simpan Dokumen opsional, dan tombol Rekap).

## Drop tabel yang dulu dirancang

- ? perjalanan_kasus (pakai Gajamada timeline langsung)
- ? lhp_kabidpropam (entry timeline dengan 	ype=lhp_uploaded sudah cukup)
- ? disposisi_kabidpropam (entry 	ype=disposisi_sent + case_position=unit_tujuan)
- ? penugasan_penyidik (entry 	ype=penugasan_started)

## Files yang berubah saat implementasi (final list)

| File | Perubahan |
|---|---|
| supabase/migrations/00X_unit_riwayat.sql | NEW: tabel unit_riwayat + index + trigger dari 	imeline |
| src/lib/timeline-merge.ts | EXTEND: setelah upsert ke 	imeline, juga update unit_riwayat |
| src/lib/gajamada/timeline.ts | NO CHANGE ? sudah cukup |
| src/components/dashboard/<unit>/page.tsx | QUERY: unit_riwayat filter per satker_key + tab Aktif/Locked |
| src/components/pengaduan/aksi-paminal.tsx | ENFORCE: disable Simpan bila is_locked |
| src/components/pengaduan/aksi-card.tsx (atau lokasi tombol \"Selesai\") | ENFORCE: disable bila is_locked |

## Status keputusan

- [x] User pilih Opsi B (final, dengan penyederhanaan).
- [x] User konfirmasi: timeline cukup, drop 4 tabel tambahan.
- [x] User konfirmasi: read-only enforcement setelah serah-terima.
- [ ] Schema Supabase: unit_riwayat + index + trigger.
- [ ] UI per-unit dashboard dengan tab Aktif/Locked.
- [ ] Enforce is_locked di tombol mutasi.

## Referensi

- [[tindak-lanjut-tab]] ? lokasi cascade Simpan tombol.
- [[two-way-sync-gajamada]] ? jalur sinkronisasi inbound (timeline adalah widget 7761377...).
- src/lib/timeline-merge.ts:7 ? getUnifiedTimeline (Gajamada + catatan lokal); di sini cascade ke unit_riwayat.
- src/lib/gajamada/timeline.ts:4 ? getTimelineFromGajamada (struktur sudah ada previous_case_position).
- src/types/index.ts:81-94 ? TimelineEntry schema (sudah ada previous_case_position, 	ype, ttachments).
- [[unit-catalog]] ? daftar satker untuk filter satker_key.
- [[status-catalog]] ? label status Gajamada untuk mapping status enum unit_riwayat.


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
