# E-PROPAM — APLIKASI MONITORING DUMAS BIDPROPAM POLDA JABAR — Desain Aplikasi

**Tanggal**: 2026-07-13
**Status**: Draft — menunggu review user

---

## 1. Ringkasan

Aplikasi monitoring pengaduan masyarakat internal Polda Jawa Barat. Memperbaiki kekurangan Gajamada Propam (gajamada-propam.polri.go.id) dalam hal UI/UX, workflow, prosedur, dan fitur melalui sinkronisasi dua arah.

**Non-goals**: Pengaduan di luar Polda Jabar, akses masyarakat umum.

---

## 2. Stack

| Domain | Pilihan |
|--------|---------|
| Frontend | Next.js / React |
| Backend | Next.js API routes + Supabase |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (role-based) |
| Hosting | Belum ditentukan |

---

## 3. Arsitektur Data (Hybrid)

- **Source of truth**: Gajamada Propam (aduan_masyarakat_v3.* / gold.report)
- **Cache lokal**: Supabase untuk dashboard, list, dan fitur tambahan
- **Sync inbound**: Cron job 3-5 menit + tombol manual sync, pull via `POST /api/v2/apps/config/handler`
- **Sync outbound**: Mutasi melalui API gateway Gajamada, trigger pull langsung setelah write sukses
- **Normalisasi**: Tabel `unit_mapping` untuk menyeragamkan nama unit Subbid/Subbag/Polres

---

## 4. Role & Halaman

| Role | Dashboard | Akses Khusus |
|------|-----------|--------------|
| **Admin** | Sistem penuh | Manajemen user, mapping unit, konfigurasi |
| **Kasubbag Yanduan** | Semua pengaduan masuk + status | Override distribusi (tanpa Kabid) + audit log, pengembalian ke Mabes, saran ke Kabid |
| **Kabid Propam** | Kinerja per satker (drill-down) | Disposisi surat, limpah ke Wassidik, monitor limphan |
| **Subbid/Subbag Unit** | Hanya fungsi sendiri | Upload dokumen, isi form satker, update status, track limpahan |
| **Polres** | Level Polres | Sama seperti unit |
| **Wassidik** | Tidak buka aplikasi | Pengaduan limpahan dianggap selesai di Bidpropam |

### Route

| Route | Role |
|-------|------|
| `/login` | Semua |
| `/dashboard` | Redirect sesuai role |
| `/pengaduan/[id]` | Semua (read/edit sesuai role) |
| `/pengaduan/[id]/form` | Unit pelaksana |
| `/admin/users` | Admin |
| `/admin/unit-mapping` | Admin |

---

## 5. Workflow Pengaduan

1. Surat diterima Subbag Yanduan (Kasubbag + Operator) — atau ditolak → kembali ke Divpropam Polri
2. Kasubbag Yanduan memberikan saran kepada Kabid Propam
3. Kabid Propam terima/tolak → disposisi ke Subbid/Subbag/Polres
4. Kabid Propam limpah ke Wassidik (bukan ranah Propam) → selesai di Bidpropam
5. Kasubbid/Kasubbag/Kasipropam Polres terima/tolak → disposisi ke unit pelaksana
6. Unit tindak lanjut sesuai fungsi dengan form/surat berbeda-beda
7. Pengaduan selesai apabila: penyelidikan tidak terbukti, sidang tidak terbukti, perdamaian, atau rekomendasi Rehabpers
8. Sync balik tiap tahapan sesuai format standar Gajamada
9. Dashboard update per user

---

## 6. Design System (UI UX Pro Max)

- **Style**: Dark Mode (OLED) — high contrast, low eye strain untuk monitoring seharian
- **Typography**: Fira Sans (body) + Fira Code (headings)
- **Warna**: Primary `#0F172A`, Accent `#0369A1`, Background `#F8FAFC`, Destructive `#DC2626`
- **Efek**: Minimal glow, smooth transitions 150-300ms, visible focus states
- **Ikon**: Lucide/Heroicons (SVG, bukan emoji)
- **Logo**: `public/logo propam pengaduan.png` dan `public/logo gajamada.png` (side-by-side)

### Penempatan Logo
- **Halaman Login**: Kedua logo di atas form login (logo propam pengaduan di kiri, logo gajamada di kanan, dipisah X)
- **Favicon**: Logo propam pengaduan (dikonversi ke .ico)
- **Navbar aplikasi**: Logo propam pengaduan (kecil) di kiri, berdampingan dengan teks "E-PROPAM"

---

## 7. Komponen UI

### Dashboard
- **Ringkasan**: Card metric (total, proses, lambat, selesai) per satker
- **Tabel**: Pagination, search, filter (kategori, status, satker, tanggal)
- **Drill-down**: Klik baris → expand list pengaduan terkait
- **Sync indicator**: Badge status sync terakhir, tombol manual sync

### Detail Pengaduan
- **Tab layout**: Info Laporan / Pelapor / Terlapor / Bukti / Timeline
- **Timeline**: Vertical stepper dengan status, tanggal, case_position, officer
- **Aksi kontekstual**: Tombol muncul sesuai role pengguna

### Aksi Yanduan
- Override distribusi (tanpa lewat Kabid) dengan catatan + audit log
- Pengembalian ke Mabes (Divpropam Polri)
- Saran ke Kabid

### Form Satker
- Tiap satker punya form berbeda (basic dulu, detail menyusul)
- Upload dokumen (PDF) ke S3

### Tabel Limpahan Wassidik
- Kolom: No Laporan, Pengirim, Tanggal Limpah, Status (Sudah/Belum)
- Dilihat oleh Yanduan dan Kabid

---

## 8. Database (Supabase)

### `pengaduan`
`id`, `prepetrator_id`, `pengirim`, `phone_no`, `email`, `category`, `content`, `summary`, `status_label`, `case_position`, `disposisi_polda`, `disposisi_polres`, `disposisi_police_function`, `polda_code`, `source`, `source_alias`, `created_date`, `updated_at`, `synced_at`

### `timeline`
`id`, `prepetrator_id` (FK), `status`, `status_alias`, `case_position`, `date_activity`, `handling_progress`, `officer_name`, `attachments` (jsonb)

### `attachments`
`id`, `pengaduan_id` (FK), `url`, `file_name`, `file_type`

### `users` (Supabase Auth)
`id`, `email`, `role` (enum), `unit_name`, `polda_code`

### `unit_mapping`
`id`, `gajamada_name`, `normalized_name`, `police_function`, `satker_level`

---

## 9. Error Handling & Edge Cases

- **Sync gagal**: Toast notifikasi, status badge jika sync terakhir >10 menit, retry 3x
- **Data tidak ditemukan**: Halaman 404 atau pesan "Pengaduan tidak ditemukan"
- **Unauthorized**: Redirect ke dashboard dengan pesan akses ditolak
- **Konflik edit**: Notifikasi jika record sudah diubah di Gajamada saat user mengedit
- **Empty state**: Placeholder "Belum ada pengaduan" dengan ilustrasi

---

## 10. Testing

- **Unit**: Mapping/normalisasi nama unit, helper fungsi
- **Integration**: Sync inbound (pull Gajamada → Supabase), sync outbound (write → Gajamada)
- **E2E**: Flow utama per role (Yanduan terima → Kabid disposisi → Unit proses)
