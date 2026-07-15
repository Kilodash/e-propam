"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const DASHBOARD_MAP: Record<string, string> = {
  "/dashboard/disposisi": "/dashboard/yanduan",
  "/dashboard/kabid/pengaduan": "/dashboard/kabid",
  "/dashboard/unit/pengaduan": "/dashboard/unit",
  "/dashboard/pengaduan": "/dashboard/yanduan",
}

export default function BackToDashboard() {
  const pathname = usePathname()

  const entry = Object.entries(DASHBOARD_MAP).find(([prefix]) =>
    pathname.startsWith(prefix)
  )
  if (!entry) return null

  return (
    <Link
      href={entry[1]}
      className="flex items-center gap-1 text-gray-400 hover:text-white text-sm"
    >
      <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
    </Link>
  )
}
