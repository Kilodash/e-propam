import type {
  GajamadaQueryRequest,
  GajamadaResponse,
  GajamadaLoginResponse,
} from "./types"

const BASE_URL = process.env.GAJAMADA_BASE_URL!
const EMAIL = process.env.GAJAMADA_EMAIL!
const PASSWORD = process.env.GAJAMADA_PASSWORD!
const CONNECTION_ID = process.env.GAJAMADA_CONNECTION_ID!
const DASHBOARD_ID = process.env.GAJAMADA_DASHBOARD_ID!
const USER_ID = process.env.GAJAMADA_USER_ID!

let sessionCookie: string | null = null

async function ensureAuth(): Promise<void> {
  if (sessionCookie) return

  const res = await fetch(`${BASE_URL}/api/v1/apps/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })

  if (!res.ok) throw new Error(`Gajamada login failed: ${res.status}`)

  const setCookie = res.headers.get("set-cookie")
  if (setCookie) sessionCookie = setCookie
}

export async function queryGajamada(
  queryId: string,
  sourceId: string[],
  name: string,
  filters: GajamadaQueryRequest["filters"] = [],
): Promise<GajamadaResponse> {
  await ensureAuth()

  const body: GajamadaQueryRequest = {
    connectionId: CONNECTION_ID,
    queryId,
    sourceId,
    name,
    chart: "table",
    database_type: "postgresql",
    filters,
    metaData: {
      widgetId: queryId.substring(0, 32),
      widgetName: name,
      menuId: "",
      dashboardId: DASHBOARD_ID,
      dashboardName: "Propam Aduan",
    },
  }

  const res = await fetch(`${BASE_URL}/api/v2/apps/config/handler`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    sessionCookie = null
    throw new Error(`Gajamada query failed: ${res.status}`)
  }

  return res.json()
}

export async function queryGajamadaAll(
  queryId: string,
  sourceId: string[],
  name: string,
  filters: GajamadaQueryRequest["filters"] = [],
  pageSize = 200,
): Promise<GajamadaResponse["data"]> {
  let allData: string[][] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const res = await queryGajamada(queryId, sourceId, name, filters)
    allData = allData.concat(res.data)
    const totalPages = res.metaData.pagination?.totalPages ?? 1
    hasMore = page < totalPages
    page++
  }

  return allData
}
