import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { executeGajamadaGateway, GATEWAY_KASUBBID_TERIMA, GATEWAY_UPLOAD_ATTACHMENT } from "@/lib/gajamada/gateway"
import { getCookie as getGajamadaCookie, uploadToGajamada, loginGajamada } from "@/lib/gajamada/client"
import { incrementRegister } from "@/lib/aksi-cards/buku-register"
import { buildNomor } from "@/lib/template-nomor"

async function getValidCookie(): Promise<string | undefined> {
  try {
    const cookie = await getGajamadaCookie()
    const test = await fetch(`${process.env.GAJAMADA_BASE_URL}/api/v1/apps/auth/validate`, {
      headers: { Cookie: cookie },
    })
    if (test.ok) return cookie
    return await loginGajamada()
  } catch {
    try { return await loginGajamada() } catch { return undefined }
  }
}

async function callGajamada(params: Record<string, unknown>, skip?: boolean) {
  if (skip) return
  const cookie = await getValidCookie()
  if (!cookie) { console.error("Gajamada cookie not available"); return }
  await executeGajamadaGateway({
    gatewayId: GATEWAY_KASUBBID_TERIMA,
    cookie,
    userId: process.env.GAJAMADA_USER_ID,
    widgetId: "epropam-unit",
    widgetName: "E-PROPAM Unit Action",
    params,
  }).catch((e: unknown) => console.error("Gajamada unit action failed:", e instanceof Error ? e.message : String(e)))
}

export async function POST(request: NextRequest) {
  let body: any
  let uploadedFiles: File[] = []
  
  const contentType = request.headers.get("content-type") || ""
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    const jsonStr = formData.get("data") as string
    body = JSON.parse(jsonStr)
    
    // Extract files
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File) {
        uploadedFiles.push(value)
      }
    }
  } else {
    body = await request.json()
  }

  const { action, pengaduanId, prepetratorId, currentPosition, progress, nextStatus, hasil, rekomendasi, skip_gajamada } = body

  if (!pengaduanId || !prepetratorId) {
    return NextResponse.json({ success: false, error: "pengaduanId dan prepetratorId wajib" }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Ambil custom template dari settings
  let customTemplates: Record<string, string> = {}
  try {
    const { data: set } = await supabase.from("app_settings").select("value").eq("key", "doc_templates").single()
    if (set?.value) {
      customTemplates = set.value as Record<string, string>
    }
  } catch {}

  try {
    switch (action) {
      case "mulai": {
        const casePosition = currentPosition || "Unit"
        const gajamadaStatus = "Proses Lidik"

        await callGajamada({
          report_id: prepetratorId,
          note: "LAKS LIDIK SESUAI DISPOSISI",
          createdBy: casePosition,
          case_handover: "",
          status: gajamadaStatus,
          case_position: casePosition,
        }, skip_gajamada)

        const { error } = await supabase.from("pengaduan").update({
          unit_status: "dalam_proses",
          unit_started_at: new Date().toISOString(),
          case_position: casePosition,
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }).eq("id", pengaduanId)

        if (error) throw error
        return NextResponse.json({ success: true, message: "Mulai proses" })
      }

      case "progress": {
        if (!progress?.trim()) {
          return NextResponse.json({ success: false, error: "Progress wajib diisi" }, { status: 400 })
        }
        const casePosition = currentPosition || "Unit"
        const gajamadaStatus = nextStatus || "Proses Lidik"

        await callGajamada({
          report_id: prepetratorId,
          note: `PROGRESS: ${progress}`,
          createdBy: casePosition,
          case_handover: "",
          status: gajamadaStatus,
          case_position: casePosition,
        }, skip_gajamada)

        const { error } = await supabase.from("pengaduan").update({
          unit_progress: progress,
          unit_status: "dalam_proses",
          case_position: casePosition,
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }).eq("id", pengaduanId)

        if (error) throw error
        return NextResponse.json({ success: true, message: "Progress dicatat" })
      }

      case "selesai": {
        if (!hasil?.trim()) {
          return NextResponse.json({ success: false, error: "Hasil penyelidikan wajib diisi" }, { status: 400 })
        }
        const casePosition = currentPosition || "Unit"
        const gajamadaStatus = rekomendasi?.startsWith("limpah") ? "Laporan Dikirim ke Unit" : "Selesai"

        await callGajamada({
          report_id: prepetratorId,
          note: `SELESAI — Hasil: ${hasil} — Rekomendasi: ${rekomendasi || "selesai"}`,
          createdBy: casePosition,
          case_handover: "",
          status: gajamadaStatus,
          case_position: casePosition,
        }, skip_gajamada)

        const { error } = await supabase.from("pengaduan").update({
          unit_status: "selesai",
          unit_completed_at: new Date().toISOString(),
          case_position: casePosition,
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }).eq("id", pengaduanId)

        if (error) throw error
        return NextResponse.json({ success: true, message: "Proses selesai" })
      }

      case "update_stage": {
        const { stage, catatan, dokumen, skipGajamada } = body

        const gajamadaStatus = stage === "perencanaan" ? "Perencanaan Lidik"
          : stage === "pengumpulan" ? "Pengumpulan Baket"
          : stage === "pengolahan" ? "Pengolahan Baket"
          : stage === "pelaporan" ? "Pelaporan"
          : "Proses Lidik"

        // Handle File Uploads ke Supabase Storage & Gajamada
        const gajamadaAttachments: { url: string; file_name: string }[] = []
        
        for (const file of uploadedFiles) {
          const fileExt = file.name.split(".").pop()
          const fileName = `${pengaduanId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const arrayBuffer = await file.arrayBuffer()
          const buffer = new Uint8Array(arrayBuffer)
          
          const { data, error } = await supabase.storage
            .from("dokumen_perkara")
            .upload(fileName, buffer, { contentType: file.type })
            
          if (!error && data) {
            const { data: publicUrl } = supabase.storage.from("dokumen_perkara").getPublicUrl(fileName)
            
            // Upload ke Gajamada (jika tidak sedang save lokal form biasa)
            // Biarpun skipGajamada=true, mungkin nanti butuh dilampirkan, tapi agar efisien,
            // Jika skipGajamada=true, URL Supabase dipakai sebagai identifier dulu?
            // Tidak, lebih baik selalu upload ke Gajamada untuk mendapatkan s3:// path.
            let gajamadaUrl = publicUrl.publicUrl
            try {
              const res = await uploadToGajamada(buffer, file.name, file.type)
              gajamadaUrl = res.path
            } catch (err) {
              console.error("Failed to forward upload to Gajamada:", err)
            }

            // Simpan attachment di array gateway
            gajamadaAttachments.push({
              url: gajamadaUrl,
              file_name: file.name
            })
            
            const attachmentId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
            await supabase.from("attachments").insert({
              id: attachmentId,
              pengaduan_id: pengaduanId,
              url: publicUrl.publicUrl,
              file_name: file.name,
              file_type: file.type,
              doc_type: body.dokumen?.[0]?.doc_type ?? null,
            })
          }
        }

        await callGajamada({
            report_id: prepetratorId,
            note: catatan || `Stage: ${stage}`,
            createdBy: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
            case_handover: "",
            status: gajamadaStatus,
            case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
            attachments: gajamadaAttachments.length > 0 ? gajamadaAttachments : undefined
          }, skip_gajamada)

          if (gajamadaAttachments.length > 0) {
            const cookie = await getGajamadaCookie().catch(() => undefined)
            if (cookie) {
              await executeGajamadaGateway({
                gatewayId: GATEWAY_UPLOAD_ATTACHMENT,
                cookie,
                userId: process.env.GAJAMADA_USER_ID,
                widgetId: "epropam-attachment",
                widgetName: "E-PROPAM Attachment",
                params: {},
                body: {
                  report_id: prepetratorId,
                  attachment: gajamadaAttachments.map(a => ({
                    name: a.file_name,
                    url: a.url,
                    type: "application/octet-stream",
                  })),
                },
              }).catch((e: unknown) => console.error("Gajamada attachment gateway failed:", e instanceof Error ? e.message : String(e)))
            }
          }

        const updates: Record<string, unknown> = {
          unit_status: "dalam_proses",
          unit_progress: catatan || `Stage: ${stage}`,
          case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }

        const { error } = await supabase.from("pengaduan").update(updates).eq("id", pengaduanId)
        if (error) throw error

        if (dokumen && Array.isArray(dokumen)) {
          const unitLabel = "Subbid Paminal"
          const now = new Date()
          const year = now.getFullYear()

          for (const doc of dokumen) {
            if (!doc.doc_type) continue
            const { nextNumber } = await incrementRegister(unitLabel, doc.doc_type, year)
            const nomor = doc.nomor ?? buildNomor(doc.doc_type, nextNumber, doc.bulan || (now.getMonth() + 1), doc.tahun || year, unitLabel, customTemplates)
            await supabase.from("dokumen_perkara").insert({
              pengaduan_id: pengaduanId,
              doc_type: doc.doc_type,
              nomor,
              tanggal: doc.tanggal ?? now.toISOString().split("T")[0],
              keterangan: doc.keterangan ?? "",
              stage,
              file_url: doc.file_url ?? null,
              created_by: "system",
            })
          }
        }

        if (catatan?.trim()) {
          await supabase.from("catatan").insert({
            pengaduan_id: pengaduanId,
            prepetrator_id: prepetratorId,
            author_email: "system@propam.polri.go.id",
            author_role: "paminal",
            content: `[Stage: ${stage}] ${catatan}`,
          })
        }

        return NextResponse.json({ success: true, message: `Stage ${stage} dicatat` })
      }

      case "save_pelanggar": {
        const { pelanggar_list } = body
        if (!pelanggar_list || !Array.isArray(pelanggar_list)) {
          return NextResponse.json({ success: false, error: "pelanggar_list wajib" }, { status: 400 })
        }
        const entries = pelanggar_list as any[]
        if (entries.length === 0) return NextResponse.json({ success: true, message: "Tidak ada data" })

        // Fetch catalog for pasal ID resolution
        let catalogData: any = null
        try {
          const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/catalog`)
          const j = await r.json()
          catalogData = j.data
        } catch {}

        const cookie = await getGajamadaCookie().catch(() => undefined)
        const gatewayId = "20270a4ffc0bc262b68aa142418d9b42"

        // Sender info — E-PROPAM sebagai identitas sistem
        const sender_name = "E-PROPAM"
        let sender_phone = "-"
        let sender_address = "-"
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase.from("profiles").select("phone, unit_name").eq("id", user.id).single()
            if (profile?.phone) sender_phone = profile.phone
            if (profile?.unit_name) sender_address = profile.unit_name
          }
        } catch {}

        const now = new Date()
        const results: string[] = []

        for (const p of entries) {
          if (!p.nama?.trim() || !p.nrp?.trim()) continue

          const pasalIdsPerpol: string[] = []
          const pasalIdsPpri: string[] = []
          if (catalogData?.pasal) {
            const allPasal = catalogData.pasal as { value: string; id: string; type: string }[]
            const resolveId = (val: string) => {
              // cek by value (display) atau by id (hash) — dari widget bisa article_id
              const f = allPasal.find(ps => ps.value === val || ps.id === val)
              return f?.id
            }
            if (Array.isArray(p.pasal_kke)) {
              for (const val of p.pasal_kke) {
                const id = resolveId(val)
                if (id) pasalIdsPerpol.push(id)
              }
            }
            if (Array.isArray(p.pasal_disiplin)) {
              for (const val of p.pasal_disiplin) {
                const id = resolveId(val)
                if (id) pasalIdsPpri.push(id)
              }
            }
          }

          if (cookie && !skip_gajamada) {
            await executeGajamadaGateway({
              gatewayId,
              cookie,
              params: {},
              userId: process.env.GAJAMADA_USER_ID,
              widgetId: "epropam-pelanggar",
              widgetName: "Data Terlapor",
              body: {
                report_id: prepetratorId,
                id: prepetratorId,
                prepetrator_type: p.prepetrator_type || "Polri",
                prepetrator_id: prepetratorId,
                prepetrator_name: p.nama,
                prepetrator_birth_place: p.tempat_lahir || "-",
                prepetrator_birth_date: p.tanggal_lahir || now.toISOString().split("T")[0],
                prepetrator_rank: p.pangkat || "BRIPDA",
                prepetrator_id_number: p.nrp,
                prepetrator_position: p.jabatan || "-",
                prepetrator_phone: p.telpon || "-",
                prepetrator_education: p.pendidikan || "-",
                prepetrator_graduation_year: p.graduation_year || "-",
                prepetrator_gender: p.jenis_kelamin || "laki-laki",
                prepetrator_functional: p.functional || p.wujud || "-",
                prepetrator_division: p.kesatuan || "POLDA JAWA BARAT",
                prepetrator_description: p.prepetrator_description || "-",
                prepetrator_category: p.kategori || "PERILAKU & INTEGRITAS PERSONAL",
                prepetrator_sub_category: p.sub_kategori || "PERILAKU SOSIAL & HUBUNGAN BERMASYARAKAT",
                prepetrator_form_of_action: p.wujud || "PENYELIDIKAN",
                sender_name: sender_name || "E-PROPAM",
                phone_no: sender_phone || "-",
                sender_address: sender_address || "-",
                application_article: (pasalIdsPerpol.length > 0 && pasalIdsPpri.length > 0) ? "kode-etik+disiplin"
                  : pasalIdsPerpol.length > 0 ? "kode-etik"
                  : "disiplin",
                prepetrator_id_article_perpol: pasalIdsPerpol,
                prepetrator_id_article_ppri: pasalIdsPpri,
              },
            }).catch((e: unknown) => console.error("Gajamada save_pelanggar failed:", e instanceof Error ? e.message : String(e)))
          }

          const catatan = `[PELANGGAR] ${p.nama} | ${p.pangkat} | NRP: ${p.nrp} | ${p.wujud} | KKE: ${pasalIdsPerpol.join(",") || "-"} | PP: ${pasalIdsPpri.join(",") || "-"}`
          await supabase.from("catatan").insert({
            pengaduan_id: pengaduanId,
            prepetrator_id: prepetratorId,
            author_email: "system@propam.polri.go.id",
            author_role: "paminal",
            content: catatan,
          })
          results.push(p.nama)
        }

        return NextResponse.json({ success: true, message: `${results.length} pelanggar disimpan: ${results.join(", ")}` })
      }

      case "pelaporan": {
        const { hasil, terbukti, pelimpahan, catatan, tindak_lanjut, dokumen,
          gelar_tanggal, gelar_notulen,
          pelanggar_nama, pelanggar_nrp, pelanggar_jabatan,
          kategori_pelanggaran, wujud_perbuatan, pasal_dilanggar,
          perdamaian_materiil, perdamaian_pembatas, perdamaian_formil, skipGajamada } = body

        if (!hasil) {
          return NextResponse.json({ success: false, error: "Hasil wajib dipilih" }, { status: 400 })
        }

        const gajamadaStatus = hasil === "perdamaian" ? "Restorative Justice"
          : hasil === "terbukti" ? "Hasil Lidik Terbukti"
          : "Tidak Terbukti"

        // Handle File Uploads ke Supabase Storage & Gajamada
        const gajamadaAttachments: { url: string; file_name: string }[] = []
        
        for (const file of uploadedFiles) {
          const fileExt = file.name.split(".").pop()
          const fileName = `${pengaduanId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const arrayBuffer = await file.arrayBuffer()
          const buffer = new Uint8Array(arrayBuffer)
          
          const { data, error } = await supabase.storage
            .from("dokumen_perkara")
            .upload(fileName, buffer, { contentType: file.type })
            
          if (!error && data) {
            const { data: publicUrl } = supabase.storage.from("dokumen_perkara").getPublicUrl(fileName)
            
            let gajamadaUrl = publicUrl.publicUrl
            try {
              const res = await uploadToGajamada(buffer, file.name, file.type)
              gajamadaUrl = res.path
            } catch (err) {
              console.error("Failed to forward upload to Gajamada:", err)
            }

            gajamadaAttachments.push({
              url: gajamadaUrl,
              file_name: file.name
            })
            
            const attachmentId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
            await supabase.from("attachments").insert({
              id: attachmentId,
              pengaduan_id: pengaduanId,
              url: publicUrl.publicUrl,
              file_name: file.name,
              file_type: file.type,
              doc_type: body.dokumen?.[0]?.doc_type ?? null,
            })
          }
        }

        await callGajamada({
            report_id: prepetratorId,
            note: catatan || `Hasil: ${hasil}`,
            createdBy: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
            case_handover: "",
            status: gajamadaStatus,
            case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
            attachments: gajamadaAttachments.length > 0 ? gajamadaAttachments : undefined
          }, skip_gajamada)

          if (gajamadaAttachments.length > 0) {
            const cookie = await getGajamadaCookie().catch(() => undefined)
            if (cookie) {
              await executeGajamadaGateway({
                gatewayId: GATEWAY_UPLOAD_ATTACHMENT,
                cookie,
                userId: process.env.GAJAMADA_USER_ID,
                widgetId: "epropam-attachment",
                widgetName: "E-PROPAM Attachment",
                params: {},
                body: {
                  report_id: prepetratorId,
                  attachment: gajamadaAttachments.map(a => ({
                    name: a.file_name,
                    url: a.url,
                    type: "application/octet-stream",
                  })),
                },
              }).catch((e: unknown) => console.error("Gajamada attachment gateway failed:", e instanceof Error ? e.message : String(e)))
            }
          }

        const updates: Record<string, unknown> = {
          unit_status: "pelaporan_selesai",
          unit_completed_at: new Date().toISOString(),
          unit_progress: `Hasil: ${hasil}${pelimpahan ? ` | Limpah ke: ${pelimpahan}` : ""}`,
          case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          status_label: gajamadaStatus,
          synced_at: new Date().toISOString(),
        }

        const { error } = await supabase.from("pengaduan").update(updates).eq("id", pengaduanId)
        if (error) throw error

        if (dokumen && Array.isArray(dokumen)) {
          const unitLabel = "Subbid Paminal"
          const now = new Date()
          const year = now.getFullYear()

          for (const doc of dokumen) {
            if (!doc.doc_type) continue
            const { nextNumber } = await incrementRegister(unitLabel, doc.doc_type, year)
            const nomor = doc.nomor ?? buildNomor(doc.doc_type, nextNumber, doc.bulan || (now.getMonth() + 1), doc.tahun || year, unitLabel, customTemplates)
            await supabase.from("dokumen_perkara").insert({
              pengaduan_id: pengaduanId,
              doc_type: doc.doc_type,
              nomor,
              tanggal: doc.tanggal ?? now.toISOString().split("T")[0],
              keterangan: doc.keterangan ?? "",
              stage: "pelaporan",
              file_url: doc.file_url ?? null,
              created_by: "system",
            })
          }
        }

        const tlLines: string[] = []
        if (tindak_lanjut && Array.isArray(tindak_lanjut)) {
          for (const tl of tindak_lanjut) {
            if (tl.checked) {
              tlLines.push(`${tl.label}: ${tl.nomor || "-"}`)
            }
          }
        }

        const catatanContent = [
          `[PELAPORAN] Hasil: ${hasil}`,
          gelar_tanggal ? `Gelar Perkara: ${gelar_tanggal}${gelar_notulen ? ` — No: ${gelar_notulen}` : ""}` : "",
          terbukti && pelanggar_nama ? `Pelanggar: ${pelanggar_nama} / NRP: ${pelanggar_nrp || "-"} / ${pelanggar_jabatan || "-"}` : "",
          terbukti && kategori_pelanggaran ? `Kategori: ${kategori_pelanggaran}` : "",
          terbukti && wujud_perbuatan ? `Wujud Perbuatan: ${wujud_perbuatan}` : "",
          terbukti && pasal_dilanggar ? `Pasal: ${pasal_dilanggar}` : "",
          terbukti && pelimpahan ? `Pelimpahan: ${pelimpahan}` : "",
          hasil === "perdamaian" ? "Status Perdamaian" : "",
          hasil === "perdamaian" ? `Syarat Materiil: ${perdamaian_materiil ? Object.entries(perdamaian_materiil).filter(([,v]) => v).map(([k]) => k).join(", ") : "-"}` : "",
          hasil === "perdamaian" ? `Prinsip Pembatas: ${perdamaian_pembatas ? Object.entries(perdamaian_pembatas).filter(([,v]) => v).map(([k]) => k).join(", ") : "-"}` : "",
          hasil === "perdamaian" ? `Syarat Formil: ${perdamaian_formil ? Object.entries(perdamaian_formil).filter(([,v]) => v).map(([k]) => k).join(", ") : "-"}` : "",
          catatan ? `Catatan: ${catatan}` : "",
          tlLines.length > 0 ? `Tindak Lanjut:\n${tlLines.join("\n")}` : "",
        ].filter(Boolean).join("\n")

        if (catatanContent.trim()) {
          await supabase.from("catatan").insert({
            pengaduan_id: pengaduanId,
            prepetrator_id: prepetratorId,
            author_email: "system@propam.polri.go.id",
            author_role: "paminal",
            content: catatanContent,
          })
        }

        // Save pelanggar snapshot if terbukti
        if (terbukti && body.pelanggar_list && Array.isArray(body.pelanggar_list)) {
          await supabase.from("pelanggar_paminal").insert({
            pengaduan_id: pengaduanId,
            data: JSON.parse(JSON.stringify(body.pelanggar_list)),
          })
        }

        return NextResponse.json({ success: true, message: "Pelaporan selesai" })
      }

      case "limpahkan": {
        const { target_status, target_case_position, pelanggar_list: limpahPelanggar, tindak_lanjut: limpahTl, gelar_tanggal: limpahGelarTgl, gelar_notulen: limpahGelarNo, pelimpahan: limpahTarget, hasil: limpahHasil } = body

        const gajamadaStatus = target_status || "Laporan Dikirim ke Satker"
        const targetPosition = target_case_position || currentPosition

        // 1 gateway call: update status + case_position
        await callGajamada({
          report_id: prepetratorId,
          note: `PELIMPAHAN — Hasil: ${limpahHasil || "terbukti"} — Tujuan: ${limpahTarget || targetPosition}`,
          createdBy: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          case_handover: limpahTarget || targetPosition,
          status: gajamadaStatus,
          case_position: targetPosition,
        }, skip_gajamada)

        // Save pelanggar snapshot
        if (limpahPelanggar && Array.isArray(limpahPelanggar)) {
          await supabase.from("pelanggar_paminal").insert({
            pengaduan_id: pengaduanId,
            data: JSON.parse(JSON.stringify(limpahPelanggar)),
          })
        }

        const limpahTlLines: string[] = []
        if (limpahTl && Array.isArray(limpahTl)) {
          for (const tl of limpahTl) { if (tl.checked) limpahTlLines.push(`${tl.label}: ${tl.nomor || "-"}`) }
        }

        const pelanggarNames = limpahPelanggar?.map((p: any) => `${p.nama} / NRP: ${p.nrp || "-"}`).join("; ") ?? ""

        const limpahUpdates: Record<string, unknown> = {
          unit_status: "pelaporan_selesai",
          unit_completed_at: new Date().toISOString(),
          unit_progress: `Limpah ke: ${limpahTarget || targetPosition}`,
          case_position: targetPosition,
          status_label: gajamadaStatus,
          previous_case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          synced_at: new Date().toISOString(),
        }
        await supabase.from("pengaduan").update(limpahUpdates).eq("id", pengaduanId)

        const limpahCatatan = [
          `[PELIMPAHAN] Hasil: ${limpahHasil || "terbukti"}`,
          limpahGelarTgl ? `Gelar Perkara: ${limpahGelarTgl}${limpahGelarNo ? ` — No: ${limpahGelarNo}` : ""}` : "",
          pelanggarNames ? `Pelanggar: ${pelanggarNames}` : "",
          `Pelimpahan ke: ${limpahTarget || targetPosition}`,
          `Status: ${gajamadaStatus}`,
          limpahTlLines.length > 0 ? `Tindak Lanjut:\n${limpahTlLines.join("\n")}` : "",
        ].filter(Boolean).join("\n")

        if (limpahCatatan.trim()) {
          await supabase.from("catatan").insert({
            pengaduan_id: pengaduanId, prepetrator_id: prepetratorId,
            author_email: "system@propam.polri.go.id", author_role: "paminal",
            content: limpahCatatan,
          })
        }

        return NextResponse.json({ success: true, message: `Pelimpahan ke ${limpahTarget || targetPosition}` })
      }

      case "upload_only": {
        const { dokumen } = body

        const gajamadaAttachments: { url: string; file_name: string }[] = []

        for (const file of uploadedFiles) {
          const fileExt = file.name.split(".").pop()
          const fileName = `${pengaduanId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

          const arrayBuffer = await file.arrayBuffer()
          const buffer = new Uint8Array(arrayBuffer)

          // Upload ke Gajamada
          let gajamadaUrl = ""
          try {
            const res = await uploadToGajamada(buffer, file.name, file.type)
            gajamadaUrl = res.path
          } catch (err) {
            console.error("Failed to forward upload to Gajamada:", err)
          }

          // Backup ke Supabase Storage (untuk fallback URL)
          let fallbackUrl = ""
          try {
            await supabase.storage
              .from("dokumen_perkara")
              .upload(fileName, buffer, { contentType: file.type })
            const { data: publicUrl } = supabase.storage.from("dokumen_perkara").getPublicUrl(fileName)
            fallbackUrl = publicUrl.publicUrl
          } catch (stErr) {
            console.error("Failed to backup to Supabase storage:", stErr)
          }

          const finalUrl = gajamadaUrl || fallbackUrl
          if (!finalUrl) continue

          gajamadaAttachments.push({
            url: finalUrl,
            file_name: file.name,
          })

          const attachmentId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
          try {
            const { error: insErr } = await supabase.from("attachments").insert({
              id: attachmentId,
              pengaduan_id: pengaduanId,
              url: finalUrl,
              file_name: file.name,
              file_type: file.type,
              doc_type: dokumen?.[0]?.doc_type ?? null,
            })
            if (insErr) console.error("Attachments insert error:", insErr)
            else console.log("Attachments saved:", file.name)
          } catch (attachErr) {
            try {
              await supabase.from("attachments").insert({
                id: attachmentId,
                pengaduan_id: pengaduanId,
                url: finalUrl,
                file_name: file.name,
                file_type: file.type,
              })
            } catch {
              console.error("Failed to save attachment record:", attachErr)
            }
          }
        }

        // Link ke report Gajamada via Gateway Attachment
        if (gajamadaAttachments.length > 0) {
          const cookie = await getGajamadaCookie().catch(() => undefined)
          if (cookie) {
            await executeGajamadaGateway({
              gatewayId: GATEWAY_UPLOAD_ATTACHMENT,
              cookie,
              userId: process.env.GAJAMADA_USER_ID,
              widgetId: "epropam-attachment",
              widgetName: "E-PROPAM Attachment",
              params: {},
              body: {
                report_id: prepetratorId,
                attachment: gajamadaAttachments.map(a => ({
                  name: a.file_name,
                  url: a.url,
                  type: "application/octet-stream",
                })),
              },
            }).catch((e: unknown) => console.error("Gajamada attachment gateway failed:", e instanceof Error ? e.message : String(e)))
          }
        }

        if (dokumen && Array.isArray(dokumen)) {
          const unitLabel = "Subbid Paminal"
          const now = new Date()
          const year = now.getFullYear()

          for (const doc of dokumen) {
            if (!doc.doc_type) continue
            const { nextNumber } = await incrementRegister(unitLabel, doc.doc_type, year)
            const nomor = doc.nomor ?? buildNomor(doc.doc_type, nextNumber, doc.bulan || (now.getMonth() + 1), doc.tahun || year, unitLabel, customTemplates)
            await supabase.from("dokumen_perkara").insert({
              pengaduan_id: pengaduanId,
              doc_type: doc.doc_type,
              nomor,
              tanggal: doc.tanggal ?? now.toISOString().split("T")[0],
              keterangan: doc.keterangan ?? "",
              stage: "perencanaan",
              file_url: null,
              created_by: "system",
            })
          }
        }

        return NextResponse.json({ success: true, message: `${gajamadaAttachments.length} file diunggah`, attachments: gajamadaAttachments })
      }

      case "save_sidang": {
        const { sidang_entries } = body
        if (!sidang_entries || !Array.isArray(sidang_entries)) {
          return NextResponse.json({ success: false, error: "sidang_entries wajib" }, { status: 400 })
        }

        const unitLabel = "Subbid Provos"
        const now = new Date()
        const year = now.getFullYear()

        for (const s of sidang_entries) {
          if (!s.khd_tanggal || !s.khd_nomor) continue
          const { nextNumber } = await incrementRegister(unitLabel, "khd", year)
          const nomor = s.khd_nomor || buildNomor("khd", nextNumber, new Date(s.khd_tanggal).getMonth() + 1, year, unitLabel, customTemplates)
          await supabase.from("dokumen_perkara").insert({
            pengaduan_id: pengaduanId,
            doc_type: "khd",
            nomor,
            tanggal: s.khd_tanggal,
            keterangan: JSON.stringify({
              pelanggar_nama: s.pelanggar_nama,
              pelanggar_nrp: s.pelanggar_nrp,
              putusan: s.putusan,
              patsus_diperberat: s.patsus_diperberat,
              banding: s.banding,
              banding_tanggal: s.banding_tanggal,
              banding_memo: s.banding_memo,
            }),
            stage: "sidang",
            file_url: null,
            created_by: "system",
          })
        }

        return NextResponse.json({ success: true, message: `${sidang_entries.length} sidang disimpan` })
      }

      case "finalize_provos": {
        const { sidang_list } = body
        const casePosition = currentPosition || "KASUBBID PROVOS POLDA JAWA BARAT"

        const catatanLines: string[] = ["[PROVOS SELESAI]"]
        if (sidang_list && Array.isArray(sidang_list)) {
          for (const s of sidang_list) {
            if (!s.khd_tanggal) continue
            catatanLines.push(`Sidang: ${s.khd_tanggal} | KHD: ${s.khd_nomor || "-"} | Pelanggar: ${s.pelanggar_nama || "-"} | Putusan: ${(s.putusan || []).join(", ") || "-"}${s.banding ? ` | Banding: ${s.banding_tanggal || "-"}` : ""}`)
          }
        }

        await supabase.from("catatan").insert({
          pengaduan_id: pengaduanId,
          prepetrator_id: prepetratorId,
          author_email: "system@propam.polri.go.id",
          author_role: "provos",
          content: catatanLines.join("\n"),
        })

        await supabase.from("pengaduan").update({
          unit_status: "pelaporan_selesai",
          unit_completed_at: new Date().toISOString(),
          case_position: casePosition,
          status_label: "Selesai",
          synced_at: new Date().toISOString(),
        }).eq("id", pengaduanId)

        return NextResponse.json({ success: true, message: "Proses provos selesai" })
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
