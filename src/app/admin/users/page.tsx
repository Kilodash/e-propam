import { ROLE_LABELS } from "@/lib/auth/roles"
import type { UserRole } from "@/types"

const DEV_USERS = [
  { email: "admin@propam.polri.go.id", role: "admin", unit_name: "-" },
  { email: "yanduan@propam.polri.go.id", role: "yanduan", unit_name: "Subbag Yanduan" },
  { email: "kabid@propam.polri.go.id", role: "kabid", unit_name: "Kabid Propam" },
  { email: "paminal@propam.polri.go.id", role: "paminal", unit_name: "Subbid Paminal" },
  { email: "provos@propam.polri.go.id", role: "provos", unit_name: "Subbid Provos" },
  { email: "wabprof@propam.polri.go.id", role: "wabprof", unit_name: "Subbid Wabprof" },
  { email: "rehabpers@propam.polri.go.id", role: "rehabpers", unit_name: "Subbag Rehabpers" },
  { email: "polres@propam.polri.go.id", role: "polres", unit_name: "Polres Jabar" },
]

export default function AdminUsersPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Manajemen User</h2>
      <div className="bg-[#0F172A] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="text-gray-300 font-medium p-3">Email</th>
              <th className="text-gray-300 font-medium p-3">Role</th>
              <th className="text-gray-300 font-medium p-3">Unit</th>
            </tr>
          </thead>
          <tbody>
            {DEV_USERS.map((p, i) => (
              <tr key={i} className="border-b border-gray-700 last:border-0">
                <td className="p-3 text-gray-200">{p.email}</td>
                <td className="p-3 text-gray-300">
                  {ROLE_LABELS[p.role as UserRole] ?? p.role}
                </td>
                <td className="p-3 text-gray-400">{p.unit_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
