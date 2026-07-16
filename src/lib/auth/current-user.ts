import { createServerClient } from "@/lib/supabase/server"

export interface CurrentUser {
  role: string
  unitName: string | null
  email: string | null
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, unit_name, email")
    .eq("id", user.id)
    .single()

  return {
    role: profile?.role ?? "yanduan",
    unitName: profile?.unit_name ?? null,
    email: user.email ?? null,
  }
}
