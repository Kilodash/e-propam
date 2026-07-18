const BASE_URL = process.env.GAJAMADA_BASE_URL!
const EMAIL = process.env.GAJAMADA_EMAIL!
const PASSWORD = process.env.GAJAMADA_PASSWORD!
const CONNECTION_ID = process.env.GAJAMADA_CONNECTION_ID!
const DASHBOARD_ID = process.env.GAJAMADA_DASHBOARD_ID!
const USER_ID = process.env.GAJAMADA_USER_ID!
const POLD_CODE = process.env.POLD_CODE || "6013"

let _cookie: string | null = null

export async function loginGajamada(): Promise<string> {
  return login()
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/apps/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    redirect: "manual",
  })

  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  // Capture ALL cookies from Set-Cookie header (token + refresh_token)
  const setCookie = res.headers.getSetCookie?.() || []
  const singleCookie = res.headers.get("set-cookie")
  const allCookies = setCookie.length > 0 ? setCookie : (singleCookie ? [singleCookie] : [])
  if (allCookies.length === 0) throw new Error("No cookies in login response")
  // Join all cookies (name=value pairs) with semicolons
  _cookie = allCookies.map(c => c.split(";")[0]).join("; ")
  return _cookie
}

export async function getCookie(): Promise<string> {
  if (_cookie) return _cookie
  return login()
}

async function fetchPage(page: number, size: number): Promise<{ data: Record<string, any>[]; totalPages: number }> {
  const cookie = await getCookie()

  const body = {
    connectionId: CONNECTION_ID,
    database: "divpropam",
    table: "gold.report",
    orderBy: "created_date",
    order: "desc",
    size,
    page,
    metaData: {
      widgetId: "8533ca87b75e04b1f39d19d98dabc0ef",
      menuId: "ce64015a07578d9195a0e589de1108c8",
      dashboardId: DASHBOARD_ID,
      mdmId: "ca44e3fd8f252225954a7d2bafa376d4",
      userId: USER_ID,
      domain: "gajamada-propam.polri.go.id",
    },
    filters: [
      { field: "status_label", fieldType: "string", operator: "is not one of", table: "gold.report", value: { is: "", isOneOf: ["Tolak", "Laporan Ditolak Polda", "Laporan ditolak"] } },
      { field: "disposisi_polda_code", fieldType: "string", operator: "is", table: "gold.report", value: { is: POLD_CODE, isOneOf: [] } },
    ],
  }

  const res = await fetch(`${BASE_URL}/api/v1/apps/data/management/get-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    _cookie = null
    const errBody = await res.text()
    throw new Error(`Gajamada list query failed: ${res.status} — ${errBody.substring(0, 300)}`)
  }

  const json = await res.json()
  const data = json.data ?? []
  const totalPages = json.metaData?.pagination?.totalPages ?? 1
  const totalElements = json.metaData?.pagination?.totalElements ?? 0
  console.log(`Gajamada page ${page}/${totalPages}: got ${data.length} rows, totalElements=${totalElements}`)
  return { data, totalPages }
}

export async function fetchAllPengaduan(): Promise<Record<string, any>[]> {
  const all: Record<string, any>[] = []
  let page = 1
  let total = 1

  while (page <= total) {
    const result = await fetchPage(page, 200)
    all.push(...result.data)
    total = result.totalPages
    page++
  }

  return all
}

export async function countByNik(nik: string): Promise<number> {
  let cookie = await getCookie()

  const body = {
    connectionId: CONNECTION_ID,
    database: "divpropam",
    table: "gold.report",
    orderBy: "created_date",
    order: "desc",
    size: 1,
    page: 1,
    noLimit: true,
    filters: [
      { field: "status_label", fieldType: "string", operator: "is not one of", table: "gold.report", value: { is: "", isOneOf: ["Tolak", "Laporan Ditolak Polda", "Laporan ditolak"] } },
      { field: "reporter_nik", fieldType: "string", operator: "is", table: "gold.report", value: { is: nik, isOneOf: [] } },
    ],
    metaData: {
      widgetId: "8533ca87b75e04b1f39d19d98dabc0ef",
      menuId: "ce64015a07578d9195a0e589de1108c8",
      dashboardId: DASHBOARD_ID,
      mdmId: "ca44e3fd8f252225954a7d2bafa376d4",
      userId: USER_ID,
      domain: "gajamada-propam.polri.go.id",
    },
  }

  async function doRequest(c: string): Promise<Response> {
    return fetch(`${BASE_URL}/api/v1/apps/data/management/get-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: c },
      body: JSON.stringify(body),
    })
  }

  let res = await doRequest(cookie)

  if (res.status === 401) {
    _cookie = null
    cookie = await login()
    res = await doRequest(cookie)
  }

  if (!res.ok) return 0

  const json = await res.json()
  return json.metaData?.pagination?.totalElements ?? 0
}

// ============================================================================
// UPLOAD FILE
// ============================================================================

export async function uploadToGajamada(fileBuffer: Buffer | Uint8Array, fileName: string, fileType: string): Promise<{ path: string; filename: string }> {
  const cookie = await getCookie()
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const generatedFileName = `${process.env.GAJAMADA_USER_ID}_${Date.now()}_${Math.random().toString(36).substring(7)}_${cleanFileName}`
  
  const url = `${BASE_URL}/api/v1/apps/upload/upload-file?folder=agent&workspaceId=&dashboardId=${DASHBOARD_ID}&createdBy=${USER_ID}&extractFile=false&filename=${encodeURIComponent(generatedFileName)}`
  
  const formData = new FormData()
  formData.append("file", new Blob([fileBuffer as any], { type: fileType }), cleanFileName)
  formData.append("tags", "assets")

  const res = await fetch(url, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Gajamada upload failed: ${res.status} — ${errBody.substring(0, 300)}`)
  }

  const json = await res.json()
  if (!json.metaData?.status) {
    throw new Error(`Gajamada upload error: ${json.metaData?.message}`)
  }

  return {
    path: json.data.path,
    filename: cleanFileName, // Use the original filename for display
  }
}

export async function queryGajamadaWidget(
  queryId: string,
  sourceId: string[],
  name: string,
  filters: { table: string; field: string; fieldType: string; operator: string; value: { is: string; isOneOf: string[] } }[] = []
): Promise<{ data: string[][] }> {
  const cookie = await getCookie()

  const body = {
    connectionId: CONNECTION_ID,
    database: "divpropam",
    queryId,
    sourceId,
    name,
    chart: "table",
    database_type: "postgresql",
    filters,
    metaData: {
      widgetId: queryId.substring(0, 32),
      widgetName: name,
      menuId: "01f63e60376afe827638ed614e1cea76",
      menuName: "Detail Laporan",
      dashboardId: DASHBOARD_ID,
      dashboardName: "Propam Aduan",
      userId: USER_ID,
      domain: "gajamada-propam.polri.go.id",
    },
  }

  const res = await fetch(`${BASE_URL}/api/v2/apps/config/handler`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    _cookie = null
    const errBody = await res.text()
    throw new Error(`Gajamada widget ${name} failed: ${res.status} — ${errBody.substring(0, 300)}`)
  }

  return res.json()
}

// Known queryIds for detail widgets (extracted from HAR)
export const QUERY = {
  timeline: "7761377d7802b8a2f07e200d8cde526b",
  infoDasar: "c732cb91b25e6df722edd4d551f174b0",
  infoPelapor: "51b2f4333042aa434e00108d2d2a907f",
  infoTerlapor: "63a0a4b198f6c6e4d931a7f71d3deaf0",
  detailLaporan: "96d2527795a0b17ff4e890d36ad660fe",
  buktiPendukung: "4f602f42d1b2b8a6d387b6026c5efba5",
  rekapLaporan: "db23b1acf5ab6564f0393a3040c2db2d",
  dataTerlapor: "fcc2ae98ceb45de19e73d0ecc04cce56",
  historyEdit: "946f2222e45a9c2e4571bf97ed8bf89e",
}

export const SOURCE_IDS = {
  timeline: ["43aaa37a892e73ccdab7ecc581bf97a4", "fec19eb5093c8901cf58d41eefb87872"],
  infoDasar: ["e3dd3c5e53fa4350bb2d65e687708e7c"],
  infoPelapor: ["092330451af086bc6f27edb14693e741"],
  infoTerlapor: ["19624557c4b9723e26811e2fe66de07a", "f18355f59f66004075a27e71061a4df5"],
  detailLaporan: ["e3dd3c5e53fa4350bb2d65e687708e7c"],
  buktiPendukung: ["d386b521c3fd0a11a2284f283fbc4aab"],
  rekapLaporan: ["0e2671c991e778604feb386c8564c848", "2487ed7ae5e0525fa5e62a87d1ff6fc5", "4d556d20cb857c9432a232b830b3a278"],
  dataTerlapor: ["56c565c5896a5d1966aae657ed113a34", "450bbebba0f02fae55daab5ef1b15874", "2bf60c8295b82b4bbf351a1a728661db", "e3dd3c5e53fa4350bb2d65e687708e7c"],
}

// ============================================================================
// TIMELINE
// ============================================================================

export async function fetchTimeline(prepetratorId: string): Promise<Record<string, any>[]> {
  try {
    const result = await queryGajamadaWidget(
      QUERY.timeline,
      SOURCE_IDS.timeline,
      "Timeline",
      [
        {
          table: 'aduan_masyarakat_v3."report_officer_detail"',
          field: "prepetrator_id",
          fieldType: "character varying",
          operator: "is",
          value: { is: prepetratorId, isOneOf: [] },
        },
      ]
    )

    const result_data = result.data ?? []
    // v2 endpoint: data = [headers_array, ...data_row_arrays]
    // Skip first row (headers)
    const dataRows = result_data.length > 0 && Array.isArray(result_data[0])
      ? result_data.slice(1)
      : result_data

    return dataRows.map((row: any) => {
      // v2 sometimes returns objects directly
      if (row && typeof row === "object" && !Array.isArray(row)) return row
      // array format
      return {
        prepetrator_id: row[0] || "",
        report_id: row[1] || "",
        type: row[2] || null,
        group_name: row[3] || null,
        status: row[4] || null,
        status_alias: row[5] || null,
        date_activity: row[6] || null,
        responsible_person_name: row[7] || null,
        officer_report_name: row[8] || null,
        handling_progress: row[9] || null,
        subject: row[10] || null,
        previous_case_position: row[11] || null,
        case_position: row[12] || null,
        polda: row[13] || null,
        polres: row[14] || null,
        police_function: row[15] || null,
        sub_function: row[16] || null,
        sub_status: row[17] || null,
        special_case: row[18] || null,
        attachments: row[19] || null,
      }
    })
  } catch {
    return []
  }
}

// ============================================================================
// DETAIL: Informasi Dasar Laporan (full pengaduan detail)
// ============================================================================
export async function fetchInfoDasar(reportId: string): Promise<Record<string, any> | null> {
  try {
    const result = await queryGajamadaWidget(
      QUERY.infoDasar,
      SOURCE_IDS.infoDasar,
      "Informasi Dasar Laporan",
      [
        {
          table: 'aduan_masyarakat_v3."report"',
          field: "id",
          fieldType: "character varying",
          operator: "is",
          value: { is: reportId, isOneOf: [] },
        },
      ]
    )
    const raw = result.data ?? []
    if (raw.length < 2) return null

    const headers = raw[0] as string[]
    const values = raw[1] as any[]
    const row: Record<string, any> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] })
    return row
  } catch {
    return null
  }
}

// ============================================================================
// DETAIL: Informasi Pelapor
// ============================================================================
export async function fetchPelapor(prepetratorId: string): Promise<Record<string, any> | null> {
  try {
    const result = await queryGajamadaWidget(
      QUERY.infoPelapor,
      SOURCE_IDS.infoPelapor,
      "Informasi Pelapor",
      [
        {
          table: 'aduan_masyarakat_v3."report"',
          field: "prepetrator_id",
          fieldType: "character varying",
          operator: "is",
          value: { is: prepetratorId, isOneOf: [] },
        },
      ]
    )
    const dataRows = parseWidgetTable(result.data)
    if (dataRows.length === 0) return null
    return dataRows[0]
  } catch {
    return null
  }
}

// ============================================================================
// DETAIL: Bukti Pendukung (attachments)
// ============================================================================
export async function fetchBuktiPendukung(prepetratorId: string): Promise<Record<string, any>[]> {
  try {
    const result = await queryGajamadaWidget(
      QUERY.buktiPendukung,
      SOURCE_IDS.buktiPendukung,
      "Bukti Pendukung",
      [
        {
          table: 'aduan_masyarakat_v3."report_prepetrators"',
          field: "prepetrator_id",
          fieldType: "character varying",
          operator: "is",
          value: { is: prepetratorId, isOneOf: [] },
        },
      ]
    )
    return parseWidgetTable(result.data)
  } catch {
    return []
  }
}

export async function fetchRekapLaporan(prepetratorId: string): Promise<Record<string, any>[]> {
  try {
    const result = await queryGajamadaWidget(
      QUERY.rekapLaporan,
      SOURCE_IDS.rekapLaporan,
      "Rekap Laporan",
      [
        {
          table: 'aduan_masyarakat_v3."report_officer_attachments"',
          field: "prepetrator_id",
          fieldType: "character varying",
          operator: "is",
          value: { is: prepetratorId, isOneOf: [] },
        },
      ]
    )
    return parseWidgetTable(result.data)
  } catch {
    return []
  }
}

// ============================================================================
// DETAIL: Data Terlapor (perpetrator detail with articles)
// ============================================================================
export async function fetchDataTerlapor(prepetratorId: string): Promise<Record<string, any> | null> {
  try {
    const result = await queryGajamadaWidget(
      QUERY.dataTerlapor,
      SOURCE_IDS.dataTerlapor,
      "Data Terlapor",
      [
        {
          table: 'aduan_masyarakat_v3."report_prepetrators"',
          field: "prepetrator_id",
          fieldType: "character varying",
          operator: "is",
          value: { is: prepetratorId, isOneOf: [] },
        },
      ]
    )
    const dataRows = parseWidgetTable(result.data)
    if (dataRows.length === 0) return null
    return dataRows[0]
  } catch {
    return null
  }
}

// Helper: skip first row (headers) in v2 widget response
function skipHeaders(data: any[] | undefined): any[] {
  if (!data || data.length === 0) return []
  // If first row is an array of strings (headers), skip it
  if (Array.isArray(data[0]) && data[0].every((v: any) => typeof v === "string" || v === null)) {
    return data.slice(1)
  }
  return data
}

function parseWidgetTable(data: any[] | undefined): Record<string, any>[] {
  if (!data || data.length === 0) return []
  const headers = data[0]
  if (!Array.isArray(headers) || !headers.every((v: any) => typeof v === "string" || v === null)) return []
  return data.slice(1).map(row => {
    if (row && typeof row === "object" && !Array.isArray(row)) return row
    const obj: Record<string, any> = {}
    headers.forEach((h: string, idx: number) => { if (h) obj[h] = (row as any[])[idx] })
    return obj
  })
}
