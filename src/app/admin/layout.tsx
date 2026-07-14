import Navbar from "@/components/layout/navbar"
import AdminSidebar from "@/components/layout/admin-sidebar"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const c = await cookies()
  const role = c.get("dev-role")?.value ?? ""
  if (role !== "admin") redirect("/dashboard")

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
