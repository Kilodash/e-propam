"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { UserRole } from "@/types"

const ACCOUNTS: Record<string, { role: UserRole; name: string }> = {
  admin: { role: "admin", name: "Admin" },
  yanduan: { role: "yanduan", name: "Kasubbag Yanduan" },
  kabid: { role: "kabid", name: "Kabid Propam" },
  paminal: { role: "paminal", name: "Subbid Paminal" },
  provos: { role: "provos", name: "Subbid Provos" },
  wabprof: { role: "wabprof", name: "Subbid Wabprof" },
  rehabpers: { role: "rehabpers", name: "Subbag Rehabpers" },
  polres: { role: "polres", name: "Polres" },
}

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const account = ACCOUNTS[username]
    if (!account) {
      setError("Akun tidak ditemukan")
      setLoading(false)
      return
    }

    document.cookie = `dev-role=${account.role};path=/;max-age=86400`
    document.cookie = `dev-user=${account.name};path=/;max-age=86400`

    const redirectMap: Record<string, string> = {
      admin: "/admin/users",
      yanduan: "/dashboard/yanduan",
      kabid: "/dashboard/kabid",
    }

    router.push(redirectMap[account.role] ?? "/dashboard/unit")
  }

  return (
    <Card className="w-full max-w-md ring-0 shadow-2xl bg-[#0F172A] text-white">
      <CardHeader className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <Image
            src="/logo propam pengaduan.png"
            alt="Propam Pengaduan"
            width={64}
            height={64}
            className="h-16 w-auto"
          />
          <span className="text-2xl font-bold text-gray-500">&times;</span>
          <Image
            src="/logo gajamada.png"
            alt="Gajamada"
            width={64}
            height={64}
            className="h-16 w-auto"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-white font-bold text-2xl leading-tight">E-PROPAM</h1>
          <h2 className="text-gray-400 font-semibold text-xs leading-tight">MONITORING DUMAS</h2>
          <h2 className="text-gray-400 font-semibold text-xs leading-tight">BIDPROPAM POLDA JABAR</h2>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Pilih Akun</Label>
            <Select value={username} onValueChange={(v) => setUsername(v ?? "")}>
              <SelectTrigger className="bg-[#1e293b] border-gray-600 text-white">
                <SelectValue placeholder="-- Pilih Akun --" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNTS).map(([key, acc]) => (
                  <SelectItem key={key} value={key}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            disabled={loading || !username}
            className="w-full bg-[#0369A1] hover:bg-[#0284c7]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Masuk
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
