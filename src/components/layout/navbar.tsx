import Image from "next/image"
import Link from "next/link"
import SyncIndicator from "@/components/dashboard/sync-indicator"
import { createServerClient } from "@/lib/supabase/server"
import { ROLE_LABELS } from "@/lib/auth/roles"
import type { UserRole } from "@/types"
import LogoutButton from "./logout-button"

export default async function Navbar() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null }

  const roleLabel = profile?.role
    ? ROLE_LABELS[profile.role as UserRole]
    : ""

  return (
    <nav className="bg-[#0F172A] border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-3">
        <Image
          src="/logo propam pengaduan.png"
          alt="E-PROPAM"
          width={32}
          height={32}
          className="h-8 w-auto"
        />
        <span className="text-white font-bold text-lg">E-PROPAM</span>
      </Link>

      <div className="flex items-center gap-4">
        <SyncIndicator />
        <span className="text-gray-300 text-sm">{roleLabel}</span>
        <LogoutButton />
      </div>
    </nav>
  )
}
