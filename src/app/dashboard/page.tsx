import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = profile?.role ?? "yanduan"

  const redirectMap: Record<string, string> = {
    admin: "/admin/users",
    yanduan: "/dashboard/yanduan",
    kabid: "/dashboard/kabid",
  }

  if (redirectMap[role]) redirect(redirectMap[role])
  redirect("/dashboard/unit")
}
