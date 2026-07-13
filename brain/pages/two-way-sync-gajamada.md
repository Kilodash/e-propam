---
id: two-way-sync-gajamada
title: Sinkronisasi dua arah dengan Gajamada Propam sebagai sumber data
category: decision
status: active
created: "2026-07-13T13:50:24"
updated: "2026-07-13T13:50:33"
---

## compiled_truth

## Yang diputuskan

Aplikasi ini menggunakan sinkronisasi data dua arah dengan Gajamada Propam (`gajamada-propam.polri.go.id`) sebagai sumber data utama, bukan membangun database independen dari nol.

## Alternatif yang dipertimbangkan

- **Database independen penuh** ? aplikasi berdiri sendiri tanpa koneksi ke Gajamada. Ditolak karena akan menyebabkan duplikasi data dan inkonsistensi.

## Alasan

Gajamada Propam adalah sistem yang sudah berjalan dan merupakan sumber data resmi pengaduan masyarakat di lingkungan Polri. Membangun ulang seluruh data dari nol tidak praktis. Sebaliknya, aplikasi ini fokus pada perbaikan UI/UX, flow, prosedur, dan fitur tambahan di atas data yang sudah ada.

## Blast radius

Keputusan ini berdampak pada seluruh arsitektur:
- Backend harus mendukung API sinkronisasi dua arah dengan Gajamada
- Schema database harus kompatibel dengan struktur data Gajamada
- Perubahan data di salah satu sistem harus direfleksikan di sistem lainnya
- Perlu mekanisme penanganan konflik dan replikasi


## timeline

- time: 2026-07-13T13:50:24
  kind: decision
  summary: "Created this page: Sinkronisasi dua arah dengan Gajamada Propam sebagai sumber data"
  source: wawancara bootstrap
  affects: [two-way-sync-gajamada]

- time: 2026-07-13T13:50:33
  kind: decision
  summary: "Keputusan awal: sinkronisasi dua arah dengan Gajamada Propam sebagai sumber data"
  source: wawancara bootstrap
  affects: [two-way-sync-gajamada]
