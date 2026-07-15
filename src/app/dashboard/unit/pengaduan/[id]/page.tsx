import { cookies } from "next/headers"
import PengaduanDetailLayout from "@/components/pengaduan/pengaduan-detail-layout"

interface PageProps { params: Promise<{ id: string }> }

const ALLOWED = ["paminal", "provos", "wabprof", "rehabpers", "polres", "admin"]

export default async function UnitDetailPage({ params }: PageProps) {
  const c = await cookies()
  const role = c.get("dev-role")?.value ?? "paminal"

  if (!ALLOWED.includes(role)) {
    return <p className="text-red-400 p-6">Akses ditolak. Role Anda: {role}.</p>
  }

  return <PengaduanDetailLayout params={params} role={role} dashboardHref="/dashboard/unit/pengaduan" />
}
