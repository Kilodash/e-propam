import Image from "next/image"
import Link from "next/link"
import SyncIndicator from "@/components/dashboard/sync-indicator"
import DevRoleSwitcher from "./dev-role-switcher"
import LogoutButton from "./logout-button"
import { ROLE_LABELS } from "@/lib/auth/roles"
import type { UserRole } from "@/types"

const isDev = process.env.NODE_ENV === "development"

export default function Navbar() {
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
        {isDev && <DevRoleSwitcher />}
        <LogoutButton />
      </div>
    </nav>
  )
}
