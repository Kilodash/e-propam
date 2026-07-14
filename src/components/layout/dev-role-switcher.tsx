"use client"

import { useRouter } from "next/navigation"
import { ROLE_LABELS } from "@/lib/auth/roles"
import type { UserRole } from "@/types"

const ROLES: UserRole[] = [
  "admin", "yanduan", "kabid", "paminal", "provos",
  "wabprof", "rehabpers", "polres", "wassidik",
]

export default function DevRoleSwitcher() {
  const router = useRouter()

  function switchRole(role: UserRole) {
    document.cookie = `dev-role=${role};path=/;max-age=86400`
    const map: Record<string, string> = {
      admin: "/admin/users",
      yanduan: "/dashboard/yanduan",
      kabid: "/dashboard/kabid",
    }
    router.push(map[role] ?? "/dashboard/unit")
    router.refresh()
  }

  return (
    <select
      className="bg-[#1e293b] border border-gray-600 text-gray-200 text-xs px-2 py-1 rounded"
      onChange={(e) => switchRole(e.target.value as UserRole)}
      defaultValue=""
    >
      <option value="" disabled>
        Pilih Role (Dev)
      </option>
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  )
}
