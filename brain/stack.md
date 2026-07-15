---
slug: stack
title: Tech stack
role: tech-stack choices
updated: "2026-07-15T20:46:24"
---

# Tech stack

## Stack

| Domain | Pilihan | Versi | Rasional |
|--------|---------|-------|----------|
| Framework | Next.js (App Router) | 16.2.10 | Full-stack JS/TS, SSR/SSG, API routes |
| Runtime | React | 19.2.4 | UI component library |
| Bundler | Turbopack | built-in | Next.js 16 default, fast HMR |
| Database | Supabase (PostgreSQL) | - | Hosted Postgres, Auth, Storage, RLS |
| Auth | Supabase Auth + custom roles | - | SSR cookie-based auth, role table |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.x + 4.13 | Utility-first, komponen headless |
| UI Primitives | @base-ui/react | 1.6.0 | Unstyled accessible primitives |
| Icons | Lucide React | 1.24.0 | Tree-shakeable SVG icons |
| Forms | Zod | 4.4.3 | Schema validation |
| Date | date-fns | 4.4.0 | Lightweight date utilities |
| Toast | Sonner | 2.0.7 | Toast notifications |
| Testing | Vitest + Testing Library | 4.1.10 | Unit + integration test |
| Linting | ESLint 9 | - | Flat config |
| Hosting | Belum ditentukan | - | - |

## Arsitektur Folder

```
src/
????????? app/            # Next.js App Router (pages + API routes)
???   ????????? admin/      # Admin pages (unit-mapping, status-mapping, users, card-layout)
???   ????????? dashboard/  # Role-based dashboards (yanduan, kabid, unit)
???   ????????? api/        # REST API routes (aksi, sync, bukti, catatan, ...)
???   ????????? login/      # Login page
???   ????????? auth/       # Auth callback
????????? components/
???   ????????? ui/         # Design system primitives
???   ????????? pengaduan/  # Pengaduan detail + card aksi
???   ????????? dashboard/  # Dashboard components
???   ????????? layout/     # Layout (navbar, sidebar)
???   ????????? auth/       # Login form
????????? lib/
???   ????????? gajamada/   # Gajamada client, sync, gateway, timeline
???   ????????? supabase/   # Supabase client (browser, server, middleware)
???   ????????? aksi-cards/ # Card config registry + presets
???   ????????? auth/       # Role access control
????????? types/          # Shared TypeScript types
```

## External APIs

| API | URL | Fungsi |
|-----|-----|--------|
| Gajamada query | `POST /api/v2/apps/config/handler` | Read data (widget query) |
| Gajamada gateway | `POST /api/v1/apps/api/gateway/execute` | Mutasi (submit aksi) |
| Supabase REST | auto-generated | CRUD + Auth + Storage |
