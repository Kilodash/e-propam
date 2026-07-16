"use client"

import { useState, useEffect, useRef } from "react"
import { LogOut, KeyRound, User, Loader2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AccountMenu() {
  const [open, setOpen] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const c = createClient()
    c.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  async function changePassword() {
    setMsg(null)
    if (!currentPassword || !newPassword) {
      setMsg({ type: "err", text: "Isi password lama dan baru" })
      return
    }
    if (newPassword.length < 8) {
      setMsg({ type: "err", text: "Password baru minimal 8 karakter" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || "Gagal")
      setMsg({ type: "ok", text: "Password berhasil diubah" })
      setCurrentPassword("")
      setNewPassword("")
    } catch (e: any) {
      setMsg({ type: "err", text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-gray-300 hover:bg-[#1e293b] hover:text-white"
        title="Akun"
      >
        <User className="w-4 h-4" />
        <span className="text-xs hidden md:inline">{email?.split("@")[0]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-[#0F172A] border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="px-3 py-2 border-b border-gray-700">
            <p className="text-xs text-gray-500">Login sebagai</p>
            <p className="text-sm text-gray-200 truncate">{email}</p>
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => { setShowPwd(true); setOpen(false); setMsg(null) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-[#1e293b] rounded"
            >
              <KeyRound className="w-3.5 h-3.5" /> Ganti Password
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-300 hover:bg-[#1e293b] rounded"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </div>
      )}

      {showPwd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-gray-700 rounded-lg p-5 max-w-md w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Ganti Password
              </h3>
              <button onClick={() => setShowPwd(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {msg && (
              <div className={`mb-3 px-3 py-2 rounded text-sm ${msg.type === "ok" ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}>
                {msg.text}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Password Lama</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#1e293b] border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-[#0369A1]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Password Baru (min. 8 karakter)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#1e293b] border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-[#0369A1]"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowPwd(false)}
                className="px-3 py-1.5 text-sm border border-gray-600 text-gray-300 rounded hover:bg-[#1e293b]"
              >
                Batal
              </button>
              <button
                onClick={changePassword}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-50 flex items-center"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
