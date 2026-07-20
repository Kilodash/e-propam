"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const REDIRECT: Record<string, string> = {
  admin: "/admin/users",
  yanduan: "/dashboard/yanduan",
  kabid: "/dashboard/kabid",
}

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInErr) throw new Error("Email atau password salah")

      const userId = data.user?.id
      if (!userId) throw new Error("Gagal mendapatkan user")

      // Pastikan session sudah siap sebelum query profile (RLS butuh auth.uid())
      await supabase.auth.getSession()

      let profile: { role: string } | null = null
      for (let i = 0; i < 5 && !profile; i++) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single()
        profile = data
        if (!profile) await new Promise(r => setTimeout(r, 200))
      }

      const role = profile?.role ?? "yanduan"
      const dest = REDIRECT[role] ?? "/dashboard/unit"

      fetch("/api/sync", { method: "POST" }).catch(() => {})

      router.push(dest)
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Login gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md ring-0 shadow-2xl bg-[#0F172A] text-white">
      <CardHeader className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <Image
            src="/logo propam pengaduan.png"
            alt="Propam Pengaduan"
            width={128}
            height={128}
            className="h-32 w-auto"
          />
          <span className="text-2xl font-bold text-gray-500">&times;</span>
          <Image
            src="/logo gajamada.png"
            alt="Gajamada"
            width={128}
            height={128}
            className="h-32 w-auto"
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
            <Label htmlFor="email" className="text-gray-300">Akun / Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="akun@ep.id"
              autoComplete="email"
              required
              className="bg-[#1e293b] border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="bg-[#1e293b] border-gray-600 text-white placeholder:text-gray-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                title={showPassword ? "Sembunyikan" : "Intip"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            disabled={loading || !email || !password}
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
