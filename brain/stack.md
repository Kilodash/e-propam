---
slug: stack
title: Tech stack
role: tech-stack choices
updated: "2026-07-13T13:50:23"
---

# Tech stack

## Tech stack

| Domain | Pilihan | Rasional |
|--------|---------|----------|
| Frontend | Next.js / React | Web app, SSG/SSR fleksibel |
| Backend | Next.js API routes + Supabase | Full-stack dalam satu framework |
| Database | Supabase (PostgreSQL) | Hosted Postgres dengan real-time, auth, storage |
| Authentication | Supabase Auth | Bawaan Supabase, mendukung role-based access |
| Hosting | Belum ditentukan | - |

## Keterangan

Stack dipilih untuk mendukung aplikasi web monitoring pengaduan dengan kebutuhan:
- Role-based access control untuk hierarki pengguna yang kompleks
- Real-time updates untuk pelacakan status pengaduan
- Integrasi API untuk sinkronisasi dua arah dengan Gajamada Propam
