import Navbar from "@/components/layout/navbar"
import AdminSidebar from "@/components/layout/admin-sidebar"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") redirect("/dashboard")

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
