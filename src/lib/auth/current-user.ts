import { createServerClient } from "@/lib/supabase/server"

export interface CurrentUser {
  role: string
  unitName: string | null
  email: string | null
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  console.log("[getCurrentUser] Creating server client...")
  const supabase = await createServerClient()
  console.log("[getCurrentUser] Getting user from auth...")
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log("[getCurrentUser] Auth user resolved:", user, "error:", error)
  if (!user) return null

  console.log("[getCurrentUser] Fetching user profile...")
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role, unit_name, email")
    .eq("id", user.id)
    .single()
  console.log("[getCurrentUser] Profile resolved:", profile, "error:", profileErr)

  return {
    role: profile?.role ?? "yanduan",
    unitName: profile?.unit_name ?? null,
    email: user.email ?? null,
  }
}
