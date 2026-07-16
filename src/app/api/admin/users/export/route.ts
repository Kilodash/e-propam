import { NextRequest, NextResponse } from "next/server"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import ExcelJS from "exceljs"

async function isAdmin(): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return profile?.role === "admin"
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 })
  }

  const includePasswords = request.nextUrl.searchParams.get("passwords") === "1"
  const supabase = createServiceClient()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, role, unit_name")
    .order("role", { ascending: true })
    .order("unit_name", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let passwordMap = new Map<string, string>()
  if (includePasswords) {
    const { data: seeds } = await supabase
      .from("seed_passwords")
      .select("user_id, password, created_at")
    for (const s of seeds ?? []) {
      passwordMap.set(s.user_id, s.password)
    }
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = "E-PROPAM"
  wb.created = new Date()

  const sheet = wb.addWorksheet("Users")
  sheet.columns = includePasswords
    ? [
        { header: "Email", key: "email", width: 40 },
        { header: "Password", key: "password", width: 24 },
        { header: "Role", key: "role", width: 14 },
        { header: "Unit", key: "unit_name", width: 50 },
      ]
    : [
        { header: "Email", key: "email", width: 40 },
        { header: "Role", key: "role", width: 14 },
        { header: "Unit", key: "unit_name", width: 50 },
      ]

  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  }
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }

  for (const p of profiles ?? []) {
    const row: Record<string, string> = {
      email: p.email ?? "",
      role: p.role ?? "",
      unit_name: p.unit_name ?? "",
    }
    if (includePasswords) {
      row.password = passwordMap.get(p.id) ?? "(tidak tersedia — bukan dari seed)"
    }
    sheet.addRow(row)
  }

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
    })
  })

  const buf = await wb.xlsx.writeBuffer()
  const filename = `e-propam-users-${new Date().toISOString().split("T")[0]}${includePasswords ? "-with-passwords" : ""}.xlsx`

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
