---
id: tindak-lanjut-tab
title: "Tab Tindak Lanjut — desain specimen (Terbukti / Tidak Terbukti)"
category: concept
status: active
tags: [ui, tab, aksi-paminal, tindak-lanjut, doc-template, renderDocBlock]
created: "2026-07-18T19:56:02"
updated: "2026-07-18T20:12:36"
---

## compiled_truth

## Tujuan

Tab **Tindak Lanjut** adalah tab ke-4 (atau ke-5 bila hasil==terbukti ? tab Pelanggar disisipkan) di src/components/pengaduan/aksi-paminal.tsx. Tab ini menampung **dokumen-dokumen yang dihasilkan setelah lidik selesai**, baik untuk jalur terbukti maupun tidak terbukti. Tampilannya **mengikuti pola tab sebelumnya** (enderDocBlock di ksi-paminal.tsx:499-561).

## Konten per kondisi hasil

### 1) hasil === "terbukti"

| Sub-bagian | Field | Tipe Dokumen |
|---|---|---|
| **Pelimpahan** | Tanggal Pelimpahan | DateInput |
| | Nomor Pelimpahan | text (format lihat aturan di bawah) |
| | Satker Tujuan | dropdown unitOptions ? **grouped per level; kecualikan unit Paminal sendiri (KAUR BINPAM SUBBID PAMINAL & parent-nya)** |
| | Tombol | Simpan / Reset / Upload |

> **Aturan format nomor pelimpahan ? configurable di pengaturan**:
> - Unit **POLDA** ? format = **Nota Dinas** (B/ND/...).
> - Unit **POLRES / BRIMOB / POLAIR** ? format = **Surat** (perlu didaftarkan di DOC_TEMPLATES).
>
> Implementation keys:
> - pp_settings.key=pelimpahan_template ? policy map polda ? nota_dinas, 
on-polda ? surat.
> - pp_settings.key=ankum_template ? configurable Nota Dinas vs Surat.
> - Tambahkan surat & pelimpahan di DOC_TEMPLATES (src/lib/template-nomor.ts).
> - Setiap dokumen opsional tetap **render + tombol Simpan/Reset/Upload** walau kosong.

### 2) hasil === "tidak_terbukti"

Render dua dokumen wajib lewat enderDocBlock:

- **Sprin Henti Lidik** ? doc_type=sprinlidik
- **Pemberitahuan ke Ankum** ? doc_type=nota_dinas

### 3) Selalu tampil

| Dokumen | Wajib? | doc_type |
|---|---|---|
| **Pemberitahuan Kepada Pelapor (SP2HP2)** | Wajib | pemberitahuan_awal |
| **Surat ke Mabes Polri** | Opsional (+ tombol Simpan) | 
ota_dinas / surat |
| **STR Jukrah** | Opsional (+ tombol Simpan) | 
ota_dinas |

## Aksi tombol

- **Simpan** ? simpanDok(docType, block, setter) (ksi-paminal.tsx:348) ? POST /api/unit action=upload_only ? **update status Gajamada** lewat gateway + cascade insert ke tabel perjalanan kasus (lihat [[sop-flow-limpahan]]).
- **Reset** ? setter(emptyBlock()) (preserve uploadedFiles).
- **Upload** ? tambah file ke lock.files (belum tersimpan).

## Visual & layout

- enderDocBlock(title, docType, block, setter) (ksi-paminal.tsx:499).
- Section dipisah <hr className=\"border-gray-700\" />.
- Blok Pelimpahan render manual (dropdown Satker Tujuan sebagai field ketiga di luar pola 2-field).
- Dropdown grouped by level (POLDA / POLRES / BRIMOB / POLAIR).

## Cascade ke perjalanan kasus (Opsi B)

Saat **Simpan** di blok Pelimpahan yang target = KABIDPROPAM atau unit tujuan:
1. Upload Nota Dinas via upload_only (sudah ada di simpanDok).
2. Trigger gateway a6159... (Teruskan/Override) untuk ganti case_position ke unit tujuan.
3. **Insert ke lhp_kabidpropam** ? unit_pengirim=PAMINAL, nomor+tanggal dari block, files_ref dari uploaded response.
4. **Insert ke perjalanan_kasus** ? event_type=lhp_kabidpropam, unit_pemilik=PAMINAL.

Untuk blok Pemberitahuan ke Ankum, Sprin Henti Lidik, dll. (saat hasil=tidak_terbukti): cukup simpanDok ? insert ke perjalanan_kasus event_type=dokumen_tl_selesai (tidak ada limpahan).

## Clarifications (locked)

1. Dropdown Satker Tujuan ? **grouped per level, exclude unit Paminal sendiri**.
2. Semua keys pp_settings baru (di atas) ? **YA**.
3. Tombol Simpan tetap dirender untuk dokumen opsional walau kosong.

## Files yang berubah saat implementasi

- src/components/pengaduan/aksi-paminal.tsx ? render blok Tab Tindak Lanjut.
- src/lib/template-nomor.ts ? tambah pelimpahan & surat.
- src/lib/status-category.ts (atau helper) ? levelOf(unit).
- src/app/api/unit/route.ts ? cascade insert ke lhp_kabidpropam & perjalanan_kasus.
- src/app/api/admin/settings/route.ts ? pelimpahan_template, nkum_template.
- Halaman **Admin ? Pengaturan** ? UI policy.

## Referensi

- Pola render blok: enderDocBlock di src/components/pengaduan/aksi-paminal.tsx.
- Pola template nomor: [[unit-catalog]] + src/lib/template-nomor.ts.
- Mutation Gajamada: [[gajamada-api-mutation-pattern]].
- Sinkronisasi inbound/outbound: [[two-way-sync-gajamada]].
- Cascade ke perjalanan kasus: [[sop-flow-limpahan]].


## timeline

- time: 2026-07-18T19:56:02
  kind: decision
  summary: "Created this page: Tab Tindak Lanjut — desain specimen (Terbukti / Tidak Terbukti)"
  source: "User request 2026-07-18 (brain update)"
  affects: [tindak-lanjut-tab]

- time: 2026-07-18T19:56:13
  kind: decision
  summary: "Catat desain Tab Tindak Lanjut: dokumen per kondisi hasil (Terbukti/Tidak Terbukti) + aturan format pelimpahan yang harus configurable di pengaturan"
  source: brain update-truth
  affects: [tindak-lanjut-tab]

- time: 2026-07-18T19:56:29
  kind: decision
  summary: "Perbaiki link rusak: hapus referensi [[aksi-paminal-tab]] yang tidak ada, ganti dengan ringkasan lokasi kode"
  source: brain update-truth
  affects: [tindak-lanjut-tab]

- time: 2026-07-18T20:02:54
  kind: decision
  summary: "Lock the 3 open questions: dropdown grouped per level (exclude unit sendiri); semua app_settings keys ditambah; Simpan tetap ada untuk dokumen opsional"
  source: brain update-truth
  affects: [tindak-lanjut-tab]

- time: 2026-07-18T20:12:36
  kind: decision
  summary: "Tambah cascade ke perjalanan kasus: simpan Dokumen di blok Pelimpahan memicu insert ke lhp_kabidpropam + perjalanan_kasus"
  source: brain update-truth
  affects: [tindak-lanjut-tab]
