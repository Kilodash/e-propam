import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  console.log("[DashboardPage] Getting current user...")
  const user = await getCurrentUser()
  console.log("[DashboardPage] User resolved:", user)
  if (!user) {
    console.log("[DashboardPage] No user, redirecting to /login")
    redirect("/login")
  }

  const redirectMap: Record<string, string> = {
    admin: "/admin/users",
    yanduan: "/dashboard/yanduan",
    kabid: "/dashboard/kabid",
  }

  if (redirectMap[user.role]) {
    console.log("[DashboardPage] Redirecting to:", redirectMap[user.role])
    redirect(redirectMap[user.role])
  }
  console.log("[DashboardPage] Redirecting to: /dashboard/unit")
  redirect("/dashboard/unit")
}
