import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const redirectMap: Record<string, string> = {
    admin: "/admin/users",
    yanduan: "/dashboard/yanduan",
    kabid: "/dashboard/kabid",
  }

  if (redirectMap[user.role]) redirect(redirectMap[user.role])
  redirect("/dashboard/unit")
}
