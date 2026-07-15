# Unit Tindak Lanjut — Design Spec

**Delivery 1/3** dari roadmap Unit Action Cards.
Fokus: Card Buat Laporan Internal + Card Proses 4-Stage Paminal + Buku Register.

## Scope

| # | Item | Role | Status |
|---|------|------|--------|
| 1 | Card Buat Lapinfo / LP-A | Paminal, Provos, Wabprof | In scope |
| 2 | Card Proses 4-stage (Paminal) | Paminal | In scope |
| 3 | Card Terima Aplikasi Lain | Kabid | Deferred |
| 4 | Card Register Pengaduan | Yanduan | Deferred |
| 5 | Buku Register | Global | In scope |
| 6 | Migration: source fields + buku_register | DB | In scope |
| 7 | API routes | Server | In scope |

## Architecture

### Database

**Tabel `pengaduan` — tambah 3 kolom:**

```sql
ALTER TABLE pengaduan ADD COLUMN source TEXT DEFAULT 'gajamada';
ALTER TABLE pengaduan ADD COLUMN source_type TEXT;      -- 'lapinfo' | 'lp_a' | null
ALTER TABLE pengaduan ADD COLUMN source_unit TEXT;      -- 'paminal' | 'provos' | 'wabprof' | null
```

Nilai default `gajamada` agar data existing tetap valid.

**Tabel `buku_register` — baru:**

```sql
CREATE TABLE buku_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit TEXT NOT NULL,                  -- 'Subbid Paminal' dll (normalized_name)
  doc_type TEXT NOT NULL,              -- 'sprinlidik' | 'lhp' | 'ba_interogasi' | 'uuk' | ...
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unit, doc_type, year)
);
```

**Tabel `dokumen_perkara` — baru:**

```sql
CREATE TABLE dokumen_perkara (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id UUID REFERENCES pengaduan(id),
  doc_type TEXT NOT NULL,              -- jenis dokumen
  nomor TEXT NOT NULL,                  -- nomor lengkap (dari template + register)
  tanggal DATE,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);
```

**Catatan tentang `berkas_perkara`:**
Tabel `berkas_perkara` tidak dibuat di Delivery 1 — pengelompokan pengaduan dalam satu berkas perkara akan ditangani di delivery terpisah. Saat ini dokumen di-attach langsung ke `pengaduan_id`.

### Card Flow

#### Card 1: Buat Lapinfo / LP-A

```
Dashboard Unit ──▶ Tombol "Buat Laporan" ──▶ Modal / Card Form

  Jenis:    [Lapinfo ▼]   ← Lapinfo (Paminal) / LP-A (Provos/Wabprof)
  Nomor:    R/LI/__/ROM/TAHUN/Subbid Paminal  ← auto-template, user isi nomor+bln+thn
  Perihal:  [___________________________]
  Kronologi:[___________________________]
  Terlapor:
    Nama:   [___________]  NRP: [___________]
    Jabatan:[___________]  Kesatuan: [___________]
  Dokumen:  [+ Tambah Dokumen Pendukung]
             ├── Jenis: [Surat Pengantar ▼] No: [___] Tgl: [📅]
             ├── ...
             └── [Hapus]

  [Simpan & Kirim ke Kabid]
```

Status setelah simpan: `Menunggu Disposisi Kabid`

#### Card 2: Proses 4-Stage (Paminal)

```
Detail Pengaduan ──▶ Card Aksi "Proses Paminal"

┌─────────────────────────────────────────┐
│ Proses Paminal                          │
├─────────────────────────────────────────┤
│                                         │
│ Stage: [Perencanaan ▼]                  │
│   Perencanaan → Pengumpulan Baket →     │
│   Pengolahan → Pelaporan                │
│                                         │
│ Catatan: [___________________________]  │
│                                         │
│ Dokumen:                                │
│ ├── [Sprinlidik ▼] No:[___] Bln:[▼] Thn:[▼] │
│ │    → Sprinlidik/05/VI/2026/Subbid Paminal │
│ ├── [Tambah Dokumen +]                  │
│                                         │
│ [Update Progress]                       │
│                                         │
│ ─── Tahap Pelaporan ─── (hanya di stage 4) │
│ Hasil: ○ Tidak Terbukti  ○ Terbukti     │
│                                         │
│ Tindak Lanjut Wajib:                    │
│ ☐ Pemberitahuan pelapor  No:[___] Tgl:[📅] │
│ ☐ Pemberitahuan Ankum    No:[___] Tgl:[📅] │
│                                         │
│ Jika Terbukti → Pelimpahan ke:         │
│   ○ Provos  ○ Wabprof  ○ Polres        │
│                                         │
│ [Selesai & Kirim]                       │
└─────────────────────────────────────────┘
```

**Aturan non-blocking:**
- Semua field opsional
- Bisa lompat stage
- Dokumen bisa ditambah kapan saja, tidak wajib di stage tertentu
- Checklist tindak lanjut tidak blocker

### Buku Register — Mekanisme

```
GET /api/register?unit=Subbid Paminal&doc_type=lhp&year=2026
→ { last_number: 5, next_number: 6, template: "R/LHP/06/VI/2026/Subbid Paminal" }

POST /api/register (auto)
  Setiap simpan dokumen → auto-increment last_number di buku_register
```

**Konversi bulan ke romawi:**
```
1:I, 2:II, 3:III, 4:IV, 5:V, 6:VI, 7:VII, 8:VIII, 9:IX, 10:X, 11:XI, 12:XII
```

### Template Nomor Dokumen

| doc_type | Template | Siapa yang pakai |
|----------|----------|------------------|
| `lapinfo` | `R/LI/{no}/{rom}/{thn}/{unit}` | Paminal (buat laporan) |
| `lp_a` | `LP-A/{no}/{rom}/{thn}/{unit}` | Provos, Wabprof (buat laporan) |
| `sprinlidik` | `Sprinlidik/{no}/{rom}/{thn}/{unit}` | Paminal (stage 1) |
| `uuk` | `Ropamina/{no}/{rom}/{thn}/{unit}` | Paminal (stage 1) |
| `ba_interogasi` | `BA/{no}/{rom}/{thn}/{unit}` | Paminal (stage 2) |
| `und_klarifikasi` | `Und/{no}/{rom}/{thn}/{unit}` | Paminal (stage 2) |
| `lhp` | `R/LHP/{no}/{rom}/{thn}/{unit}` | Paminal (stage 4) |
| `nota_dinas` | `B/ND/{no}/{rom}/{thn}/{unit}` | Paminal (stage 4) |
| `notulen_gelar` | `Notulen/{no}/{rom}/{thn}/{unit}` | Paminal (stage 3) |
| `pem_pelapor` | `B/{no}/{rom}/{thn}/{unit}` | Paminal (tindak lanjut) |
| `pem_ankum` | `B/{no}/{rom}/{thn}/{unit}` | Paminal (tindak lanjut) |

### Tahapan Stage (Paminal)

| Stage | Label | Deskripsi |
|-------|-------|-----------|
| `perencanaan` | Perencanaan | Susun UUK, bentuk tim, terbitkan Sprinlidik |
| `pengumpulan` | Pengumpulan Baket | Klarifikasi, wawancara, interogasi, pengamatan |
| `pengolahan` | Pengolahan | Catat, nilai, tafsir, simpulkan Baket + gelar |
| `pelaporan` | Pelaporan | Buat LHP, kirim ke pimpinan + hasil akhir |

## Component Tree

```
src/components/pengaduan/
├── aksi-buat-laporan.tsx      BARU — Card Buat Lapinfo / LP-A
├── aksi-paminal.tsx            BARU — Card Proses 4-stage
├── doc-template-input.tsx      BARU — Reusable: template nomor + register
└── (existing files tetap)

src/lib/aksi-cards/
├── presets.ts                  UPDATE — tambah DOC_TEMPLATES, PAMINAL_STAGES
├── registry.ts                 UPDATE — proses-paminal pakai komponen baru
├── types.ts                    UPDATE — tambah AksiBuatLaporanProps
└── buku-register.ts            BARU — helper get/set nomor register

src/lib/
├── roman-month.ts              BARU — konversi bulan ke romawi
└── template-nomor.ts           BARU — build nomor dari template + params

src/app/api/
├── register/route.ts           BARU — GET next number, POST increment
├── pengaduan/create/route.ts   BARU — POST buat Lapinfo/LP-A
└── unit/route.ts               UPDATE — extend untuk aksi paminal (stage update, pelaporan)

supabase/migrations/
└── 007_unit_tindaklanjut.sql   BARU — migration source fields + buku_register + dokumen_perkara
```

## Data Flow

```
1. Buat Laporan:
   User → Card Form → POST /api/pengaduan/create
     → INSERT pengaduan (source=internal, source_type=lapinfo/lp_a)
     → POST /api/register (increment nomor)
     → INSERT dokumen_perkara
     → INSERT catatan (kronologi)
     → Notif: "Menunggu Disposisi Kabid"

2. Proses 4-Stage:
   User → Card Paminal → POST /api/unit (action=update_stage)
     → GET /api/register (dapat nomor template)
     → INSERT/UPDATE dokumen_perkara
     → Tambah catatan progress
     → Action=pelaporan → update hasil + pelimpahan
     → Notif: "LHP selesai" atau "Dilimpahkan ke Provos/Wabprof/Polres"
```

## Deferred Items

| Item | Alasan |
|------|--------|
| Card Terima Aplikasi Lain (Kabid) | Delivery 2 |
| Card Register Pengaduan (Yanduan) | Delivery 2 |
| Card Proses Provos (sidang disiplin) | Delivery 3 |
| Card Proses Wabprof (sidang KKEP) | Delivery 3 |
| Berkas Perkara (grouping multi-pengaduan) | Delivery 3 |
| Buku Register UI (read-only admin view) | Delivery 3 |
