import LoginForm from "@/components/auth/login-form"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
      <LoginForm />
    </div>
  )
}
