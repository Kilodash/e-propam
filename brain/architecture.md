---
slug: architecture
title: System architecture
role: system architecture
updated: "2026-07-15T20:45:36"
---

# System architecture

## Overview

Aplikasi monitoring pengaduan masyarakat Bidpropam Polda Jabar. Next.js 16 App Router sebagai full-stack framework, Supabase (PostgreSQL) sebagai database utama, dan Gajamada Propam sebagai sumber data eksternal via REST API.

**Tiga sumber data:**
1. **Supabase** ? penyimpanan lokal: users, roles, unit/status mapping, card layout, catatan, audit trail
2. **Gajamada** ? source of truth: pengaduan, status, timeline, bukti, case_position
3. **Gajamada Gateway** ? mutasi balik: submit disposisi, override, kembalikan, proses unit

## Module graph

 + "`" + mermaid
graph TD
  subgraph "Client (React)"
    UI[UI Components]
    AKSI[Card Aksi]
    DASH[Dashboard Pages]
  end

  subgraph "Server (Next.js)"
    API[API Routes]
    MW[Middleware - Auth + RLS]
    LIB[Lib - Business Logic]
  end

  subgraph "Data"
    SB[(Supabase)]
    GAJA[Gajamada Propam]
  end

  UI --> API
  DASH --> API
  AKSI --> API
  API --> LIB
  LIB --> SB
  LIB --> GAJA
  GAJA -->|inbound sync| SB
  SB -->|unit/status mapping| LIB
  LIB -->|outbound gateway| GAJA
  MW --> SB
 + "`" + 

## Constraints

- **Gajamada tidak boleh diubah.** Status Gajamada adalah source of truth. E-PROPAM hanya membaca dan mengirim mutasi via gateway.
- **Role-based access.** Setiap role (yanduan, kabid, unit, admin) punya scope data berbeda.
- **Sinkronisasi dua arah.** Inbound: Gajamada ? Supabase (sync.ts). Outbound: E-PROPAM ? Gajamada via gateway.
- **Unit mapping pattern-based.** gajamada_name immutable, hanya normalized_name yang boleh disesuaikan.
- **Status pattern-based.** categorizeStatus() menggunakan RULES[] array, bukan enum database.
