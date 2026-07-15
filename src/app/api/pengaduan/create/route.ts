import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { incrementRegister } from "@/lib/aksi-cards/buku-register"
import { buildNomor } from "@/lib/template-nomor"

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const body = await request.json()
  const { source_type, source_unit, perihal, kronologi, nomor_urut, bulan, tahun, author_email, author_role } = body

  if (!source_type || !source_unit || !perihal) {
    return NextResponse.json({ success: false, error: "source_type, source_unit, dan perihal wajib" }, { status: 400 })
  }

  const docType = source_type === "lapinfo" ? "lapinfo" : "lp_a"
  const year = tahun || new Date().getFullYear()
  const month = bulan || (new Date().getMonth() + 1)

  const unitLabel = source_unit === "paminal" ? "Subbid Paminal"
    : source_unit === "provos" ? "Subbid Provos"
    : source_unit === "wabprof" ? "Subbid Wabprof"
    : source_unit

  let nomorUrut = nomor_urut
  if (!nomorUrut) {
    const { nextNumber } = await incrementRegister(unitLabel, docType, year)
    nomorUrut = nextNumber
  }

  const nomorLengkap = buildNomor(docType, nomorUrut, month, year, unitLabel)
  const id = crypto.randomUUID()

  const { error } = await supabase.from("pengaduan").insert({
    id,
    prepetrator_id: id,
    source: "internal",
    source_type,
    source_unit,
    summary: perihal,
    content: kronologi,
    status_label: "Menunggu Disposisi Kabid",
    case_position: "KABID PROPAM POLDA JAWA BARAT",
    polda_code: 6013,
    created_date: new Date().toISOString(),
    synced_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  await supabase.from("dokumen_perkara").insert({
    pengaduan_id: id,
    doc_type: docType,
    nomor: nomorLengkap,
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: `Laporan ${source_type === "lapinfo" ? "Informasi" : "Model A"} - ${perihal}`,
    created_by: author_email || "system",
  })

  if (kronologi?.trim()) {
    await supabase.from("catatan").insert({
      pengaduan_id: id,
      prepetrator_id: id,
      author_email: author_email || "system@propam.polri.go.id",
      author_role: author_role || source_unit,
      content: `[Laporan Dibuat]\nNomor: ${nomorLengkap}\nPerihal: ${perihal}\n\n${kronologi}`,
    })
  }

  return NextResponse.json({ success: true, id, nomor: nomorLengkap })
}
