import { createServerClient } from "@/lib/supabase/server"
import { ROLE_LABELS } from "@/lib/auth/roles"
import type { UserRole } from "@/types"

export default async function AdminUsersPage() {
  const supabase = await createServerClient()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return <p className="text-red-400">Error: {error.message}</p>
  }

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
              <th className="text-gray-300 font-medium p-3">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {profiles && profiles.length > 0 ? (
              profiles.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-700 last:border-0">
                  <td className="p-3 text-gray-200">{p.email}</td>
                  <td className="p-3 text-gray-300">
                    {ROLE_LABELS[p.role as UserRole] ?? p.role}
                  </td>
                  <td className="p-3 text-gray-400">{p.unit_name ?? "-"}</td>
                  <td className="p-3 text-gray-400">
                    {new Date(p.created_at).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-6">
                  Belum ada user
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
