"use server"

import { createServiceClient } from "@/lib/supabase/server"
import type { CardLayoutConfig } from "./types"

export async function getAksiCardsForRole(role: string, userScope?: string): Promise<CardLayoutConfig[]> {
  const supabase = createServiceClient()
  let query = supabase
    .from("card_layout_config")
    .select("card_id, enabled, sort_order, config, user_scope")
    .eq("role", role)
    .order("sort_order")

  if (userScope) {
    query = query.or(`user_scope.is.null,user_scope.eq.${userScope}`)
  }

  const { data, error } = await query

  if (error || !data) return []

  // Dedupe by cardId, preferring user_scope-specific config over NULL
  const seen = new Map<string, any>()
  for (const row of data) {
    const existing = seen.get(row.card_id)
    if (!existing || (row.user_scope && !existing.user_scope)) {
      seen.set(row.card_id, row)
    }
  }

  return Array.from(seen.values()).map((row: any) => ({
    cardId: row.card_id,
    enabled: row.enabled,
    sortOrder: row.sort_order,
    config: row.config ?? {},
  }))
}

export async function upsertCardLayoutConfig(
  role: string,
  configs: { cardId: string; enabled: boolean; sortOrder: number; config?: Record<string, any>; userScope?: string }[]
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
        user_scope: cfg.userScope ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "role, card_id, user_scope" })

    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}
