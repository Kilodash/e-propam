# Redesign Card Aksi Provos

**Tanggal:** 2026-07-20
**Status:** draft
**Terkait:** `src/components/pengaduan/aksi-provos.tsx`, brain roadmap Card Provos

## Tujuan

Redesign card aksi provos dari 5 tab (Pemeriksaan/Sidang/Putusan/TL/Rekap) menjadi 3 tab (Pemeriksaan Awal/Sidang/Rekap) dengan struktur baru yang mencerminkan alur kerja provos sesuai SOP.

## Struktur Tab

### Tab 1: Pemeriksaan Awal

Berisi 5 elemen berurutan:

| # | Komponen | DocType | Format Nomor | Keterangan |
|---|----------|---------|-------------|------------|
| a | Gelar Perkara Provos | `gelar_provos` | Notulen/{no}/{rom}/HUK.12.10./{thn}/{unit} | DocBlock penuh |
| b | Laporan Polisi | `lp_a` | LP-A/{no}/{rom}/HUK.12.10./{thn}/{unit} | DocBlock penuh |
| c | Sprin Riksa | `sprin_riksa` | Sprin.Riksa/{no}/{rom}/HUK.12.10./{thn} | DocBlock penuh, tanpa unit |
| d | Berkas DP3D | `dp3d` | DP3D/{no}/-K/{rom}/HUK.12.10./{thn}/{unit} | DocBlock penuh, ada "-K" |
| e | Perdamaian | - | - | Tombol buka dialog, reuse dari paminal |

**Alur:**
1. User isi dan simpan dokumen (a-d) satu per satu
2. Perdamaian (e) hanya bisa dilakukan sebelum DP3D di-submit
3. Dialog perdamaian = sama persis dengan paminal (syarat materiil 4 checkbox, syarat pembatas 2 checkbox, syarat formil 4 checkbox)

**State awal:** Tab aktif saat status unit belum "pelaporan_selesai"/"selesai".

### Tab 2: Sidang

**Konsep:** 1 sidang = 1 pelanggar. Bisa ada N sidang per pengaduan.

Setiap entri sidang:

| # | Komponen | Keterangan |
|---|----------|-----------|
| a | Identitas Terduga Pelanggar | Pilih dari dropdown (pelanggar dari paminal + pelanggar yang ditambahkan provos) ATAU tombol "Tambah Pelanggar Baru" |
| b | Tgl Sidang + KHD | DocBlock, format: KHD/{no}/{rom}/HUK.12.10./{thn}/{unit} |
| c | Putusan Sidang | Multi-select combobox dari 7 opsi PP No.2/2003 |
| d | Banding | Checkbox "Mengajukan Banding" → jika dicentang, muncul: tgl banding (validasi max 14 hari setelah tgl putusan) + optional nomor memo |

**Opsi Putusan Sidang (PP No.2/2003):**
1. Teguran tertulis
2. Penundaan mengikuti pendidikan paling lama 1 tahun
3. Penundaan kenaikan gaji berkala
4. Penundaan kenaikan pangkat paling lama 1 tahun
5. Mutasi yang bersifat demosi (penurunan jabatan atau pindah fungsi)
6. Pembebasan dari jabatan
7. Penempatan dalam tempat khusus (Patsus) paling lama 21 hari

**Patsus:** Jika dipilih, muncul sub-option checkbox "Pemberatan +7 hari" (total 28 hari). Syarat pemberatan: negara/operasi darurat ATAU pelanggar melakukan pelanggaran >3x berturut-turut.

**Tombol:** [Simpan Sidang] [Hapus Sidang] [Tambah Sidang Baru]

**Pelanggar Baru:** Saat "Tambah Pelanggar Baru", form input identitas pelanggar (nama, pangkat, nrp/nip, jabatan, kesatuan — field minimal). Data disimpan ke `pelanggar_paminal` dengan source "provos".

### Tab 3: Rekap

Sama dengan Rekap tab sekarang + tambahan ringkasan sidang:
- Daftar dokumen tersimpan dari `dokumen_perkara`
- Ringkasan semua sidang (pelanggar, tgl sidang, putusan, banding)
- Tombol 1 baris: **Selesai & Kirim** + **Cetak** + **Salin**
- Konfirmasi dialog sebelum submit final

## Template Nomor Baru

Tambahkan ke `src/lib/template-nomor.ts`:

```ts
gelar_provos: "Notulen/{no}/{rom}/HUK.12.10./{thn}/{unit}",
// lp_a: update existing ke format provos
// sprin_riksa: baru
sprin_riksa: "Sprin.Riksa/{no}/{rom}/HUK.12.10./{thn}",
// dp3d: update existing
dp3d: "DP3D/{no}/-K/{rom}/HUK.12.10./{thn}/{unit}",
khd: "KHD/{no}/{rom}/HUK.12.10./{thn}/{unit}",
```

DocBlock autoFill dari `aksi-provos.tsx` perlu memasukkan doc types tambahan: `gelar_provos`, `sprin_riksa`, `khd`.

## Arsitektur

**Pola:** Component-per-tab (seperti paminal).

```
src/components/pengaduan/
  aksi-provos.tsx              → orkestrator (state, API calls, tab switching)
  provos/
    pemeriksaan-awal-tab.tsx   → Tab 1 (gelar, LP-A, sprin riksa, DP3D, perdamaian)
    sidang-tab.tsx             → Tab 2 (list sidang, add/remove, per-sidang form)
    sidang-entry.tsx           → Form 1 entri sidang (identitas, KHD, putusan, banding)
```

Mengikuti struktur yang sudah ada untuk paminal (`proses-lidik-tab.tsx`, `pelaporan-tab.tsx`, dll).

## Data Model

### Sidang (dokumen_perkara)

Setiap sidang menyimpan dokumen ke `dokumen_perkara` dengan doc_type:
- `khd` — KHD sidang
- `putusan_sidang` — hasil putusan (bisa multiple per sidang)
- `banding` — memo banding jika ada

### Putusan Sidang

Disimpan sebagai array di field JSONB (`dokumen_perkara.metadata` atau field baru `putusan`):
```json
[
  { "sidang_index": 0, "pelanggar_id": "xxx", "tanggal_sidang": "...", "khd_nomor": "...", "putusan": ["Teguran tertulis", "Patsus (21 hari)"], "patsus_diperberat": false, "banding": false, "banding_tanggal": null, "banding_memo": null }
]
```

### Pelanggar Provos

Pelanggar yang ditambahkan dari provos disimpan ke `pelanggar_paminal` dengan tambahan field `source = "provos"` (perlu ditambahkan ke tabel jika belum ada).

## API Endpoint

Gunakan existing `/api/unit` dengan action baru:
- `save_sidang` — simpan 1 entri sidang (KHD + putusan)
- `delete_sidang` — hapus sidang
- `finalize_provos` — selesai semua, update status

## Backward Compatibility

- Tidak perlu hapus file existing — ganti isi `aksi-provos.tsx` total
- Tab lama (Pemeriksaan, Sidang, Putusan, TL) dihapus dari UI
- Data existing tetap bisa diakses via view-only (Rekap/read-only)
- `PROVOS_HASIL` enum lama dihapus dari kode provos

## File yang Diubah

| File | Perubahan |
|------|----------|
| `src/components/pengaduan/aksi-provos.tsx` | Rewrite total orkestrator |
| `src/components/pengaduan/provos/pemeriksaan-awal-tab.tsx` | Baru |
| `src/components/pengaduan/provos/sidang-tab.tsx` | Baru |
| `src/components/pengaduan/provos/sidang-entry.tsx` | Baru |
| `src/lib/template-nomor.ts` | Tambah 4 template (+ update 2) |
| `src/components/pengaduan/paminal/doc-block.tsx` | Tambah autoFill doc types |
| `src/app/api/unit/route.ts` | Tambah action handlers |
| `supabase/migrations/` | Optional: tambah kolom source ke pelanggar_paminal |

## Deferred / Out of Scope

- Cetak dalam format surat resmi (akan di-handle terpisah)
- Integrasi KHD ke Gajamada (menunggu info HAR)
- Widget/tampilan tracking status sidang
- Buku Register UI (roadmap deferred)
