import { NextRequest, NextResponse } from "next/server"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"

async function isAdmin(): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return profile?.role === "admin"
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Hanya admin yang dapat mengubah password user lain" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { newPassword } = body

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.auth.admin.updateUserById(id, { password: newPassword })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: "Password user berhasil direset" })
}
