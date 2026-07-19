import Navbar from "@/components/layout/navbar"
import AutoSync from "@/components/dashboard/auto-sync"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AutoSync />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
