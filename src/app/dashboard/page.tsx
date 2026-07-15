import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const c = await cookies()
  const role = c.get("dev-role")?.value ?? "yanduan"

  const redirectMap: Record<string, string> = {
    admin: "/admin/users",
    yanduan: "/dashboard/yanduan",
    kabid: "/dashboard/kabid",
  }

  if (redirectMap[role]) redirect(redirectMap[role])
  redirect("/dashboard/unit")
}
