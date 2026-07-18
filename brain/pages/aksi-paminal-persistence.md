---
id: aksi-paminal-persistence
title: "Aksi Paminal: persistence blok data + sync offender ke DetailTerlapor"
category: concept
status: active
tags: [ui, aksi-paminal, persistence, dokumen-perkara, pelanggar]
created: "2026-07-18T20:56:25"
updated: "2026-07-18T20:56:29"
---

## compiled_truth

## Tujuan

Dua gap UX di Aksi Paminal component:

1. **Data blok di Aksi Paminal hilang saat navigasi**: setelah Paminal mengisi `tanggal + nomor` di blok Pemberitahuan Awal / UUK / Sprin Lidik / Spri Henti Lidik / Pdt Ankum / SP2HP2 / Nota Dinas / Pelimpahan, nilai `tanggal` & `nomor` tidak di-persist. Yang ter-persist hanya file attachments (yang di-restore via useEffect ke `uploadedFiles` saat mount). User jadi harus input ulang tiap kali balik ke halaman detail.

2. **Data pelaku/terlapor hasil Paminal edit tidak muncul di `DetailTerlapor`**: `handleSavePelanggar` ??? `save_pelanggar` action di `/api/unit` sudah sync ke Gajamada via gateway `20270a4ffc0bc262b68aa142418d9b42` dan catat di tabel `catatan`, tapi:
   - `pengaduan.terlapor_*` columns di Supabase tidak diupdate setelah save_pelanggar (pengaduan row reflects initial sync only).
   - `DetailTerlapor` di `src/components/pengaduan/detail-gajamada.tsx:142` baca hanya dari `pengaduan.terlapor_*` ??? jadi tidak menampilkan hasil edit Paminal.

## Solusi

### 1) Persistence blok data

`dokumen_perkara` table (sudah ada, migration `010_unit_tindaklanjut.sql:35`) punya kolom `doc_type, nomor, tanggal, stage` ??? persis yang kita butuhkan.

**API**: di action `upload_only` (`src/app/api/unit/route.ts:529`), setelah insert ke `attachments` dan sebelum response sukses, **upsert row ke `dokumen_perkara`** dengan field:
```
{ pengaduan_id, prepetrator_id, doc_type, nomor, tanggal, stage, file_url (joined pertama), created_by }
```
Pattern sudah ada di action `mulai` dan `pelaporan` (line 250 pattern). Tinggal di-replicate di `upload_only`.

Stage `proses_lidik` / `pelaporan` / `tindak_lanjut` dikirim dari client (saat ini `dokumen` payload tidak punya stage ??? tambah opsional).

**Read API**: extend `GET /api/bukti?pengaduanId=X` agar return juga dokumen_perkara rows (atau tambah endpoint GET `/api/dokumen-perkara`). Sederhana: tambah field `dokumen` di response existing.

**Frontend** (`src/components/pengaduan/aksi-paminal.tsx`):
- Tambah useEffect kedua untuk set `{ tanggal, nomor }` per state dari hasil fetch.
- Pola lookup: per `doc_type` ??? ambil row dokumen_perkara terbaru ??? spread ke state.

Setelah ini, user balik ke detail ??? form pre-filled dari Supabase. Reset tetap berfungsi untuk reset local state.

### 2) Pelanggar sync + display

Buat tabel `pelangar_paminal` keyed by (pengaduan_id, prepetrator_id) dengan kolom:
```
id, pengaduan_id, prepetrator_id, key,
nama, pangkat, nrp, jabatan, kesatuan, functional,
tempat_lahir, tanggal_lahir, telpon, pendidikan, jenis_kelamin,
wujud, kategori, sub_kategori,
pasal_disiplin text[], pasal_kke text[],
prepetrator_type, prepetrator_description,
gajamada_synced_at, created_by, created_at, updated_at
```

**API**: tambah `POST /api/pelanggar` dengan action `upsert_paminal` (skip_gajamada + payload), insert list ke tabel. Panggil dari `handleSavePelanggar` di client setelah Gajamada sync success (best-effort, swallow on error agar tidak blokir UI).

**Frontend `handleSavePelanggar`** (aksi-paminal.tsx): setelah `fetch('/api/unit', { action: 'save_pelanggar' })` sukses ??? upsert ke `/api/pelanggar`.

**Tambah useEffect di AksiPaminal**: fetch `/api/pelanggar?pengaduanId=X&prepetratorId=Y` ??? set `pelanggarList` initial state.

**DetailTerlapor**: ubah ke client component (atau tambah fetch effect di parent). Fetch `pelangar_paminal` rows. Tampilkan sebagai "Identitas Pelanggar (diedit oleh Paminal)" subtitle di bawah row `pengaduan.terlapor_*`. Prioritas tampil: jika ada row di `pelangar_paminal` ??? pakai itu; kalau tidak ??? pakai `pengaduan.terlapor_*`.

## File yang berubah

| File | Perubahan |
|---|---|
| `supabase/migrations/022_pelanggar_paminal.sql` | NEW: tabel + index + RLS |
| `src/app/api/unit/route.ts` (upload_only) | INSERT/UPSERT baris ke `dokumen_perkara` per dokumen |
| `src/app/api/pelanggar/route.ts` | NEW: POST upsert + GET list |
| `src/app/api/bukti/route.ts` | EXTEND: response include `dokumen_perkara` rows |
| `src/components/pengaduan/aksi-paminal.tsx` | useEffect restore `{tanggal, nomor}`; send `stage` di simpanDok; fetch & set `pelanggarList` initial; handleSavePelanggar call /api/pelanggar |
| `src/components/pengaduan/detail-gajamada.tsx` | DetailTerlapor tambahkan fetch `pelangar_paminal` rows; render section subtitle "Identitas Pelanggar (diedit oleh Paminal)" |

## Catatan

- Edit Pelanggar ??? call Gajamada via existing gateway `20270a4ffc0bc262b68aa142418d9b42` (sudah ada di save_pelanggar) ??? lalu upsert local tabel.
- Best-effort cascading: jika Gajamada fails tapi local upsert success ??? tetap saved locally. Kembalikan warning ke user.
- Server-side enforcement: blok data restore via GET (read-only). Mutation upsert tetap di /api/unit & /api/pelanggar dengan validasi payload.
- `is_locked` (dari SOP flow cabang sebelumnya) bisa diterapkan: jika `case_position != satker_key`, GET endpoint tetap return data (read-only legacy), tapi client `disabled` onSimpan.

## Status keputusan

- [x] Pakai `dokumen_perkara` existing untuk blok data persistence.
- [x] Tambah tabel `pelangar_paminal` untuk offender sync.
- [x] DetailTerlapor extended untuk tampilkan rows `pelangar_paminal`.
- [ ] Konfirmasi user sebelum implementasi.

## Referensi

- [[tindak-lanjut-tab]]
- Persisted `dokumen_perkara` schema: `supabase/migrations/010_unit_tindaklanjut.sql:35`.
- Pattern insert di `mulai` action: `src/app/api/unit/route.ts:250`.
- save_pelanggar gateway: `20270a4ffc0bc262b68aa142418d9b42` (`src/app/api/unit/route.ts:293`).
- Persisted attachments table: `attachments` (existing) ??? saat ini `upload_only` hanya insert di `attachments`, bukan dokumen_perkara.


## timeline

- time: 2026-07-18T20:56:25
  kind: decision
  summary: "Created this page: Aksi Paminal: persistence blok data + sync offender ke DetailTerlapor"
  source: User request 2026-07-18
  affects: [aksi-paminal-persistence]

- time: 2026-07-18T20:56:29
  kind: decision
  summary: "Catat desain persistence blok data (dokumen_perkara existing) + sync offender baru (tabel pelangar_paminal) untuk tampil di DetailTerlapor E-PROPAM"
  source: brain update-truth
  affects: [aksi-paminal-persistence]
