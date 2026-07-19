import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import PengaduanDetailLayout from "@/components/pengaduan/pengaduan-detail-layout"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }>; searchParams: Promise<{ unit?: string }> }

export default async function KabidDetailPage(props: PageProps) {
  const user = await getCurrentUser()
  if (!user || (user.role !== "kabid" && user.role !== "admin")) redirect("/login")
  return <PengaduanDetailLayout {...props} role={user.role} userEmail={user.email ?? "propam.polda@polri.go.id"} isLeadership={/^(KASUBBID|KASUBBAG|KABID)/i.test(user.unitName ?? "")} userUnitName={user.unitName} dashboardHref="/dashboard/kabid/pengaduan" />
}
