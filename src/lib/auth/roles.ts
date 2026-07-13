import type { UserRole } from "@/types"

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["/dashboard", "/pengaduan", "/admin"],
  yanduan: ["/dashboard", "/pengaduan"],
  kabid: ["/dashboard", "/pengaduan"],
  paminal: ["/dashboard", "/pengaduan"],
  provos: ["/dashboard", "/pengaduan"],
  wabprof: ["/dashboard", "/pengaduan"],
  rehabpers: ["/dashboard", "/pengaduan"],
  polres: ["/dashboard", "/pengaduan"],
  wassidik: [],
}

export function canAccess(role: UserRole, path: string): boolean {
  const allowed = ROLE_PERMISSIONS[role]
  if (!allowed) return false
  return allowed.some((p) => path.startsWith(p))
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  yanduan: "Kasubbag Yanduan",
  kabid: "Kabid Propam",
  paminal: "Subbid Paminal",
  provos: "Subbid Provos",
  wabprof: "Subbid Wabprof",
  rehabpers: "Subbag Rehabpers",
  polres: "Polres",
  wassidik: "Wassidik",
}
