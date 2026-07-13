export interface GajamadaQueryRequest {
  connectionId: string
  queryId: string
  sourceId: string[]
  name: string
  chart: string
  database_type: string
  filters: GajamadaFilter[]
  metaData: GajamadaMetadata
}

export interface GajamadaFilter {
  table: string
  field: string
  fieldType: string
  operatorField?: string
  operator: string
  value: { is: string; isOneOf: string[]; gte?: number; lte?: number }
}

export interface GajamadaMetadata {
  widgetId: string
  widgetName: string
  menuId: string
  dashboardId: string
  dashboardName: string
}

export interface GajamadaResponse {
  metaData: {
    status: boolean
    executionTime: number
    responseCode: number
    message: string
    pagination?: {
      size: number
      totalElements: number
      totalPages: number
    }
  }
  data: string[][]
  additionalInfo?: { query: string }
}

export interface GajamadaLoginResponse {
  metaData: { status: boolean; responseCode: number; message: string }
  data: {
    user: { id: string; fullname: string; username: string; email: string }
  }
}
