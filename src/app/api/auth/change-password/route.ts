import { NextRequest, NextResponse } from "next/server"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
  }

  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Password lama dan baru wajib diisi" }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 })
  }

  // Verify current password by signing in
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  if (signInErr) {
    return NextResponse.json({ error: "Password lama salah" }, { status: 400 })
  }

  // Update password via service client (auth API)
  const service = createServiceClient()
  const { error: updateErr } = await service.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: "Password berhasil diubah" })
}
