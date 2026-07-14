import { createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const YANDUAN_POSITIONS = [
  "KASUBBAG YANDUAN POLDA JAWA BARAT",
  "OPERATOR YANDUAN POLDA JAWA BARAT",
]

export default async function DisposisiRedirectPage() {
  const c = await cookies()
  const role = c.get("dev-role")?.value ?? "yanduan"

  if (role !== "yanduan" && role !== "admin") {
    return (
      <p className="text-red-400 p-6">
        Halaman ini hanya untuk Yanduan. Anda login sebagai: {role}.
      </p>
    )
  }

  const supabase = createServiceClient()

  // Ambil Dumas paling akhir (created_date paling baru)
  const { data: latest } = await supabase
    .from("pengaduan")
    .select("id")
    .in("case_position", YANDUAN_POSITIONS)
    .order("created_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest?.id) {
    redirect(`/dashboard/disposisi/${latest.id}`)
  }

  // Tidak ada dumas
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <p className="text-gray-500 mb-4">Tidak ada dumas Yanduan</p>
      <Link href="/dashboard/yanduan" className="text-blue-700 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4 inline mr-1" /> Kembali ke Dashboard Yanduan
      </Link>
    </div>
  )
}
