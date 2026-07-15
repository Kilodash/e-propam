"use server"

import { createServiceClient } from "@/lib/supabase/server"
import type { CardLayoutConfig } from "./types"

export async function getAksiCardsForRole(role: string): Promise<CardLayoutConfig[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("card_layout_config")
    .select("card_id, enabled, sort_order, config")
    .eq("role", role)
    .order("sort_order")

  if (error || !data) return []

  return data.map((row: any) => ({
    cardId: row.card_id,
    enabled: row.enabled,
    sortOrder: row.sort_order,
    config: row.config ?? {},
  }))
}

export async function upsertCardLayoutConfig(
  role: string,
  configs: { cardId: string; enabled: boolean; sortOrder: number; config?: Record<string, any> }[]
) {
  const supabase = createServiceClient()

  for (const cfg of configs) {
    const { error } = await supabase
      .from("card_layout_config")
      .upsert({
        role,
        card_id: cfg.cardId,
        enabled: cfg.enabled,
        sort_order: cfg.sortOrder,
        config: cfg.config ?? {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "role, card_id" })

    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}
