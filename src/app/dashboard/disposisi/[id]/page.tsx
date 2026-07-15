import { cookies } from "next/headers"
import PengaduanDetailLayout from "@/components/pengaduan/pengaduan-detail-layout"

interface PageProps { params: Promise<{ id: string }> }

export default async function DisposisiDetailPage({ params }: PageProps) {
  const c = await cookies()
  const role = c.get("dev-role")?.value ?? "yanduan"

  if (role !== "yanduan" && role !== "admin") {
    return <p className="text-red-400 p-6">Akses ditolak. Halaman ini untuk Yanduan.</p>
  }

  return <PengaduanDetailLayout params={params} role={role} dashboardHref="/dashboard/disposisi" />
}
