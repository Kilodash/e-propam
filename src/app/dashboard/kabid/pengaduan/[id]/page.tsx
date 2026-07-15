import { cookies } from "next/headers"
import PengaduanDetailLayout from "@/components/pengaduan/pengaduan-detail-layout"

interface PageProps { params: Promise<{ id: string }> }

export default async function KabidDetailPage({ params }: PageProps) {
  const c = await cookies()
  const role = c.get("dev-role")?.value ?? "kabid"

  if (role !== "kabid" && role !== "admin") {
    return <p className="text-red-400 p-6">Akses ditolak. Halaman ini untuk Kabid.</p>
  }

  return <PengaduanDetailLayout params={params} role={role} dashboardHref="/dashboard/kabid/pengaduan" />
}
