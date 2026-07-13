"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
      }}
      title="Keluar"
    >
      <LogOut className="w-4 h-4 text-gray-400" />
    </Button>
  )
}
