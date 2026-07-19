<!-- BEGIN brain.md -->
## Project Brain

This project keeps a **Project Brain**: a persistent memory layer of its durable decisions, requirements, and constraints. Read `./BRAIN.md` for the full read/write contract.

Use it actively:
- Before any task or discussion, load the relevant brain context with the `brain` CLI's read commands.
- Whenever a decision, requirement, constraint, or durable insight surfaces — in discussion or in code — record it with the `brain` CLI before moving on; don't wait to be asked.
- All reads and writes go through the `brain` CLI — never hand-edit brain files.

The brain skills (`brain-setup`, `brain-page`, `brain-ingest`, `brain-bootstrap`) are installed in your global skills directory.
<!-- END brain.md -->

## Aturan Proyek E-PROPAM

### Unit Mapping
- **`gajamada_name` TIDAK BOLEH diubah.** Nama ini harus persis sama dengan data di sistem Gajamada (sumber: file HAR atau query Supabase `pengaduan.case_position`).
- Hanya **`normalized_name`** yang boleh disesuaikan untuk label display di E-PROPAM (combobox, filter, admin page).
- **Unit baru yang tidak ada di Gajamada tidak boleh ditambahkan ke seed** (`src/app/api/migrate/route.ts`).
- Pola nama Gajamada: `[JABATAN] [FUNGSI] [LOKASI] POLDA JAWA BARAT`.

### Status
- Status **pattern-based**, bukan enumeration. Gunakan `src/lib/status-category.ts` — `categorizeStatus()` untuk semua badge/display.
- Rule baru ditambahkan di `RULES[]` array, bukan di database `status_mapping`.

### Sync
- Sinkronisasi **dua arah**: inbound = Gajamada → Supabase (`src/lib/gajamada/sync.ts`), outbound = E-PROPAM → Gajamada via gateway (`src/lib/gajamada/aksi-yanduan.ts`, `aksi-kabid.ts`, `aksi-unit.ts`).
- Sync manual: `POST /api/sync`. Auto-sync: setiap load dashboard page, cek stale >1 jam (`src/components/dashboard/auto-sync.tsx`).
- Jangan trigger sync pada aksi user (submit disposisi, review kabid, dll) — data langsung ke Supabase + Gajamada via gateway.

### File Kunci
| File | Fungsi |
|------|--------|
| `src/app/api/migrate/route.ts` | Seed unit_mapping + status_mapping via REST |
| `src/lib/gajamada/sync.ts` | Sync inbound: Gajamada → Supabase |
| `src/lib/gajamada/aksi-yanduan.ts` | Aksi Yanduan: saran, override, kembalikan, submit |
| `src/lib/gajamada/aksi-kabid.ts` | Aksi Kabid: setujui, tolak |
| `src/lib/gajamada/aksi-unit.ts` | Aksi Unit: mulai, progress, selesai |
| `src/lib/gajamada/client.ts` | Gajamada API client (login, fetch, widget query) |
| `src/lib/status-category.ts` | Pattern-based status categorizer |
| `src/lib/unit-search.ts` | extractSearchKey() + sortUnits() |
| `src/lib/gajamada/unit-mapping.ts` | buildUnitMapping() auto-detect |
| `supabase/migrations/005_seed_units.sql` | Seed unit_mapping |

### Batasan Agen
- **Tidak boleh membuat asumsi.** Apabila menemukan ambiguitas, tanyakan sebelum bertindak.
- **Hanya gunakan file HAR sebagai rujukan prosedural ke Gajamada.** Setiap panggilan gateway, parameter, field names, widget IDs, harus disamakan persis dengan yang ada di file HAR (`har/*.har`). Jangan mengarang parameter atau mengasumsikan format tanpa bukti dari HAR.
- **Tidak boleh mengubah bagian yang tidak diperintahkan untuk diubah.**
- **Tidak boleh mengubah status Gajamada.** Status dari Gajamada adalah source of truth.
- **Sync balik ke Gajamada menggunakan nama dan status Gajamada asli**, bukan modifikasi E-PROPAM.
- **Tanyakan apabila ada yang tidak sesuai** sebelum melanjutkan eksekusi.
- **JANGAN commit atau push kecuali user memerintahkan secara eksplisit.** Selalu tunjukkan perubahan (diff) dan tunggu konfirmasi sebelum `git commit` dan `git push`. Pengecualian: commit lokal (tanpa push) diizinkan jika user meminta eksplisit.

### Gaya Komunikasi
- Singkat, tegas, tanpa basa-basi.
- Tanpa kata kosmetik ("tentu", "baiklah", "saya akan", "berikut adalah").
- Tanpa penjelasan panjang setelah kode — kode sudah menjelaskan dirinya.
- Langsung ke inti. Fragmen diterima.

### Verifikasi Perbaikan
- **Sebelum melaporkan hasil perbaikan, KONFIRMASI dulu hasilnya benar sesuai yang dilaporkan.** Jangan klaim "fixed" tanpa verifikasi.
- Verifikasi minimal: cek kode yang diubah, pastikan flow logic benar, trace data dari input ke output.
- Kalau tidak bisa verifikasi langsung (misal butuh akses Gajamada atau Supabase production), laporkan dengan disclaimer jelas: "perlu di-test di production".

### Brain & Progress
- Gunakan `brain read-root roadmap` untuk cek milestone dan progress sebelum memulai tugas.
- Update `brain` setelah setiap keputusan penting atau milestone tercapai.
- Sebelum commit, update `brain/roadmap.md` dengan status terkini.
