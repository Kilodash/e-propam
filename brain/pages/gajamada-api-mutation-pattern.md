---
id: gajamada-api-mutation-pattern
title: "Gajamada mutation API: gateway/execute + config/handler pattern"
category: decision
status: active
tags: [gajamada, api, mutation, ebdesk, gateway, reverse-engineering]
created: "2026-07-13T16:54:49"
updated: "2026-07-13T16:55:20"
---

## compiled_truth

## compiled_truth

Gajamada Propam (`gajamada-propam.polri.go.id`) adalah aplikasi low-code eBdesk dengan 2 jenis HTTP endpoint utama ? keduanya `POST application/json` tanpa CSRF token, otentikasi via session cookie:

### 1. READ ? `POST /api/v2/apps/config/handler`
Menjalankan **query tersimpan** yang diidentifikasi oleh `queryId` (MD5-ish hash). Body:
```json
{
  "connectionId": "245b8fd7c4a763019d5172fad5ec0086",
  "queryId": "63a0a4b198f6c6e4d931a7f71d3deaf0",
  "sourceId": ["19624557c4b9723e26811e2fe66de07a","..."],
  "name": "Informasi Terlapor",
  "chart": "table",
  "database_type": "postgresql",
  "filters": [{ "table": "aduan_masyarakat_v3.\"report_prepetrators\"", "field": "prepetrator_id", "fieldType": "character varying", "operator": "is", "value": { "is": "260608000047-00001" } }],
  "enableCache": false,
  "metaData": { "widgetId": "...", "widgetName": "...", "menuId": "...", "dashboardId": "...", "dashboardName": "Propam Aduan" }
}
```
Response: `{ metaData: { status, responseCode, message, pagination }, data: [[headers...], [row...]], additionalInfo: { query: "WITH ... SQL ..." } }` ? jadi server **membangun SQL** dari filter yang dikirim client, dan SQL lengkap dikembalikan di `additionalInfo.query`.

### 2. MUTATION ? `POST /api/v1/apps/api/gateway/execute` ? INI YANG DICARI
Menjalankan **API Gateway tersimpan** (backend call ke service internal) yang diidentifikasi oleh `gatewayId` (MD5-ish). Body dari HAR `kasubbid terima.har` entry #10 (dipanggil dari JS function `onSubmitTerimaTeruskan`):
```json
{
  "client": "Propam Polri",
  "gatewayId": "aa6159ec4d7847e8282943f7dfe87c29",
  "params": {
    "report_id": "260608000047-00001",
    "note": "LAKS LIDIK SESUAI DISPOSISI",
    "createdBy": "KASUBBID PAMINAL POLDA JAWA BARAT",
    "case_handover": "",
    "status": "Laporan Diterima",
    "case_position": "KAUR BINPAM SUBBID PAMINAL POLDA JAWA BARAT"
  },
  "body": {},
  "headers": {},
  "additionalPath": "",
  "additionalParams": {},
  "additionalFileParams": {},
  "tags": ["Propam Polri"],
  "createdBy": "a07611b17f063f8b5460f2eaa5c7deda",
  "startDate": "",
  "endDate": "",
  "dashboardId": "1769155096865",
  "sessionId": "",
  "logging": false,
  "appendedLog": false,
  "metaData": {
    "widgetId": "6f2cfeabd19ddafce8fc98f5c9d9ad63",
    "widgetName": "Widget Aksi",
    "menuId": "01f63e60376afe827638ed614e1cea76",
    "menuName": "Detail Laporan",
    "dashboardId": "1769155096865",
    "dashboardName": "Propam Aduan",
    "userId": "a07611b17f063f8b5460f2eaa5c7deda",
    "domain": ""
  }
}
```
Response success (HTTP 200):
```json
{
  "metaData": { "status": true, "responseCode": 200, "message": "Success", "execution_time": 279 },
  "data": {
    "gatewayId": "aa6159ec4d7847e8282943f7dfe87c29",
    "params": { ... sama dengan request ... },
    "response_status_code": 200,
    "executionStatus": "success",
    "code": 200,
    "response": {
      "success": true,
      "status": 200,
      "data": {
        "report_id": "260608000047-00001",
        "status": "Laporan Diterima",
        "disposisi_created": true,
        "disposisi": {
          "report_id": "260608000047",
          "prepetrator_id": "260608000047-00001",
          "updated_at": "2026-07-13T09:51:30.575Z",
          "case_position": "KAUR BINPAM SUBBID PAMINAL POLDA JAWA BARAT",
          "police_function": "PAMINAL",
          "police_level": "POLDA",
          "sub_function": "SUBBID PAMINAL",
          "polda": "POLDA JAWA BARAT",
          "polda_code": "6013",
          "polres": null,
          "polres_code": null,
          "special_case": null,
          "satker": null
        }
      },
      "message": "Report status updated successfully"
    }
  }
}
```

### Headers (kedua endpoint)
Tidak ada CSRF token, tidak ada `X-Requested-With`. Hanya header browser standar: `Accept`, `Content-Type: application/json`, `Origin: https://gajamada-propam.polri.go.id`, `Sec-Fetch-*`. **Otentikasi = session cookie** (tidak ada di HAR; dikirim otomatis browser).

### Katalog queryId (read) yang ditemukan di HAR `kasubbid terima.har`
- `63a0a4b198f6c6e4d931a7f71d3deaf0` ? "Informasi Terlapor" (widget `b7b630239fb7ad396f2a432f47e876b2`)
- `946f2222e45a9c2e4571bf97ed8bf89e` ? "History Edit" (widget `5cea803380b931d14df231453c466448`)
- `51b2f4333042aa434e00108d2d2a907f` ? "Informasi Pelapor" (widget `295a451dd09f9f90b84e651c4c65e98f`)
- `c732cb91b25e6df722edd4d551f174b0` ? "Informasi Dasar Laporan" (widget `dad5b834f5a7a46b8a119d6e54211dbd`)
- `7761377d7802b8a2f07e200d8cde526b` ? "Timeline" (widget `1d05ba6d572d5d65307ffd83ca1399d4`)
- `96d2527795a0b17ff4e890d36ad660fe` ? "Detail laporan" (widget `36584f99010d42c82e9382364e9d32fe`)

### Katalog gatewayId (mutation) yang ditemukan
- `aa6159ec4d7847e8282943f7dfe87c29` ? "Widget Aksi" (widget `6f2cfeabd19ddafce8fc98f5c9d9ad63`) ? "onSubmitTerimaTeruskan" (kasubbid terima + ubah unit)

### Pola keyakinan
- Setiap aksi UI (Tombol "Terima", "Teruskan", "Override", "Kembalikan", "Disposisi") di Gajamada eBdesk **pasti dibungkus** dalam satu `gatewayId` di endpoint `api/gateway/execute` ini. Untuk menemukan gatewayId lain, ambil HAR baru dari user yang melakukan aksi tersebut.
- `gatewayId` adalah konstanta yang didefinisikan di server eBdesk saat admin Gajamada merancang aplikasi ? tidak bisa ditebak; harus di-intersep dari request browser.
- `params` adalah **dictionary dinamis** ? nama field (`status`, `case_position`, `case_handover`, `note`, `createdBy`, `report_id`) ditentukan oleh config gateway di server. Payload berubah-ubah per gateway.

### Template kode (TypeScript / Next.js server action)
```ts
type GajamadaGatewayResponse<T = unknown> = {
  metaData: { status: boolean; responseCode: number; message: string; execution_time: number };
  data: {
    gatewayId: string;
    response_status_code: number;
    executionStatus: "success" | "error";
    code: number;
    response: { success: boolean; status: number; data: T; message: string };
  };
};

export async function executeGajamadaGateway<T = unknown>(args: {
  cookie: string;             // session cookie "SESSION=xxx; ..."
  gatewayId: string;          // mis. "aa6159ec4d7847e8282943f7dfe87c29"
  params: Record<string, unknown>;
  userId: string;             // dari auth context
  widgetName?: string;        // hanya untuk logging
}): Promise<GajamadaGatewayResponse<T>> {
  const r = await fetch("https://gajamada-propam.polri.go.id/api/v1/apps/api/gateway/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "*/*",
      "Origin": "https://gajamada-propam.polri.go.id",
      "Cookie": args.cookie,
    },
    body: JSON.stringify({
      client: "Propam Polri",
      gatewayId: args.gatewayId,
      params: args.params,
      body: {},
      headers: {},
      additionalPath: "",
      additionalParams: {},
      additionalFileParams: {},
      tags: ["Propam Polri"],
      createdBy: args.userId,
      startDate: "",
      endDate: "",
      dashboardId: "1769155096865",
      sessionId: "",
      logging: false,
      appendedLog: false,
      metaData: {
        widgetId: "unknown",          // unknown unless captured from HAR
        widgetName: args.widgetName ?? "E-PROPAM Mutasi",
        menuId: "01f63e60376afe827638ed614e1cea76",
        menuName: "Detail Laporan",
        dashboardId: "1769155096865",
        dashboardName: "Propam Aduan",
        userId: args.userId,
        domain: "",
      },
    }),
  });
  if (!r.ok) throw new Error(`Gajamada gateway HTTP ${r.status}`);
  return r.json() as Promise<GajamadaGatewayResponse<T>>;
}
```

### Cara pakai untuk E-PROPAM
- "Override distribusi", "Pengembalian ke Mabes", "Disposisi" ? masing-masing HARUS di-intersep dari HAR baru untuk dapat `gatewayId` spesifik + nama field `params`. Setelah punya gatewayId, panggil `executeGajamadaGateway` di atas.
- Lihat juga: [[two-way-sync-gajamada]] untuk konteks kenapa arsitektur ini dipilih.


## timeline

- time: 2026-07-13T16:54:49
  kind: decision
  summary: "Created this page: Gajamada mutation API: gateway/execute + config/handler pattern"
  source: "HAR analysis: har/gajamada kasubbid terima.har (2026-07-13)"
  affects: [gajamada-api-mutation-pattern]

- time: 2026-07-13T16:55:20
  kind: decision
  summary: Rewrote compiled_truth to the new best understanding
  source: brain update-truth
  affects: [gajamada-api-mutation-pattern]
