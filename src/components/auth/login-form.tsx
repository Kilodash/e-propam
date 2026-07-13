"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Email atau password salah")
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
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
        <CardTitle className="text-2xl">E-PROPAM</CardTitle>
        <p className="text-gray-400 text-sm">
          Aplikasi Monitoring Dumas Bidpropam Polda Jabar
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="polda_jabar@polri.go.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#1e293b] border-gray-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#1e293b] border-gray-600 text-white"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            disabled={loading}
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
