"use client"

import { useEffect, useState } from "react"
import { ROLE_LABELS } from "@/lib/auth/roles"
import type { UserRole } from "@/types"
import { KeyRound, Loader2, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Profile {
  id: string
  email: string
  role: UserRole
  unit_name: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [resetUser, setResetUser] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(json => setUsers((json.data ?? []) as Profile[]))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  async function submitReset() {
    if (!resetUser || !newPassword || newPassword.length < 8) {
      setMsg({ type: "err", text: "Password minimal 8 karakter" })
      return
    }
    setResetLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${resetUser.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || "Gagal")
      setMsg({ type: "ok", text: `Password ${resetUser.email} berhasil direset` })
      setResetUser(null)
      setNewPassword("")
    } catch (e: any) {
      setMsg({ type: "err", text: e.message })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Manajemen User</h2>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/users/export"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#0369A1] hover:bg-[#0284c7] text-white rounded"
          >
            <Download className="w-3.5 h-3.5" /> Export User
          </a>
          <a
            href="/api/admin/users/export?passwords=1"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-yellow-700 hover:bg-yellow-600 text-white rounded"
            title="Termasuk password seed (hanya tersedia untuk user hasil seed 012)"
          >
            <Download className="w-3.5 h-3.5" /> Export + Password
          </a>
        </div>
      </div>

      {msg && (
        <div className={`mb-3 px-3 py-2 rounded text-sm ${msg.type === "ok" ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-[#0F172A] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="text-gray-300 font-medium p-3">Email</th>
              <th className="text-gray-300 font-medium p-3">Role</th>
              <th className="text-gray-300 font-medium p-3">Unit</th>
              <th className="text-gray-300 font-medium p-3 w-32">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                  Memuat...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">Belum ada user</td>
              </tr>
            ) : users.map(p => (
              <tr key={p.id} className="border-b border-gray-700 last:border-0">
                <td className="p-3 text-gray-200">{p.email}</td>
                <td className="p-3 text-gray-300">
                  {ROLE_LABELS[p.role] ?? p.role}
                </td>
                <td className="p-3 text-gray-400">{p.unit_name ?? "-"}</td>
                <td className="p-3">
                  <button
                    onClick={() => { setResetUser(p); setNewPassword("") }}
                    className="text-xs text-[#0369A1] hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" /> Reset Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-gray-700 rounded-lg p-5 max-w-md w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Reset Password</h3>
              <button onClick={() => setResetUser(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Reset password untuk <span className="text-gray-200">{resetUser.email}</span>
            </p>
            <label className="block text-xs text-gray-400 mb-1">Password Baru</label>
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 karakter"
              autoFocus
              className="w-full px-3 py-2 text-sm bg-[#1e293b] border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-[#0369A1] font-mono"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetUser(null)} disabled={resetLoading}>
                Batal
              </Button>
              <Button onClick={submitReset} disabled={resetLoading}>
                {resetLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
