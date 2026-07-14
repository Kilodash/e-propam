const GAJAMADA = process.env.GAJAMADA_BASE_URL || "https://gajamada-propam.polri.go.id"
const DASHBOARD_ID = process.env.GAJAMADA_DASHBOARD_ID || "1769155096865"

export type GatewayResponse<T = unknown> = {
  metaData: { status: boolean; responseCode: number; message: string; execution_time?: number }
  data: {
    gatewayId: string
    response_status_code?: number
    executionStatus: "success" | "error"
    code: number
    response: { success: boolean; status: number; data: T; message: string }
  }
}

// Known gateway IDs from HAR
export const GATEWAY_KASUBBID_TERIMA = "aa6159ec4d7847e8282943f7dfe87c29"

export async function executeGajamadaGateway<T = unknown>(args: {
  gatewayId: string
  params: Record<string, unknown>
  cookie?: string
  userId?: string
  widgetId?: string
  widgetName?: string
  signal?: AbortSignal
}): Promise<GatewayResponse<T>> {
  const cookie = args.cookie || process.env.GAJAMADA_SESSION_COOKIE
  if (!cookie) {
    throw new Error(
      "Gajamada session cookie not set. Set GAJAMADA_SESSION_COOKIE env var (capture from browser DevTools after login)."
    )
  }

  const r = await fetch(`${GAJAMADA}/api/v1/apps/api/gateway/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "*/*",
      "Origin": GAJAMADA,
      "Cookie": cookie,
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
      createdBy: args.userId || process.env.GAJAMADA_USER_ID || "",
      startDate: "",
      endDate: "",
      dashboardId: DASHBOARD_ID,
      sessionId: "",
      logging: false,
      appendedLog: false,
      metaData: {
        widgetId: args.widgetId || "epropam-aksi",
        widgetName: args.widgetName || "E-PROPAM Aksi",
        menuId: "01f63e60376afe827638ed614e1cea76",
        menuName: "Detail Laporan",
        dashboardId: DASHBOARD_ID,
        dashboardName: "Propam Aduan",
        userId: args.userId || process.env.GAJAMADA_USER_ID || "",
        domain: "",
      },
    }),
    signal: args.signal,
  })

  if (!r.ok) {
    throw new Error(`Gajamada gateway HTTP ${r.status}`)
  }

  const json = (await r.json()) as GatewayResponse<T>
  if (!json.metaData.status || !json.data?.response?.success) {
    throw new Error(`Gajamada gateway error: ${json.data?.response?.message ?? json.metaData?.message}`)
  }
  return json
}
