import type { ComponentType } from "react"
import type { Pengaduan } from "@/types"
import type { UnitFilterOption } from "@/lib/unit-search"

export type CardVariant = "default" | "warning" | "danger"

export interface CardLayoutConfig {
  cardId: string
  enabled: boolean
  sortOrder: number
  config: Record<string, any>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>

export interface AksiCardDefinition {
  component: AnyComponent
  defaultTitle: string
  defaultVariant: CardVariant
  defaultOrder: number
  roles: string[]
  requiredConfig: string[]
}

export interface AksiCardRenderProps {
  role: string
  pengaduanId: string
  prepetratorId: string
  pengaduan: Pengaduan
  unitOptions: UnitFilterOption[]
  config?: Record<string, any>
}
