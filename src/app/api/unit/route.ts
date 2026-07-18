import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { executeGajamadaGateway, GATEWAY_KASUBBID_TERIMA, GATEWAY_UPLOAD_ATTACHMENT } from "@/lib/gajamada/gateway"
import { getCookie as getGajamadaCookie, uploadToGajamada } from "@/lib/gajamada/client"
import { incrementRegister } from "@/lib/aksi-cards/buku-register"
import { buildNomor } from "@/lib/template-nomor"

async function callGajamada(params: Record<string, unknown>, skip?: boolean) {
  if (skip) return
  const cookie = await getGajamadaCookie().catch(() => undefined)
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

        if (!skipGajamada) {
          await callGajamada({
            report_id: prepetratorId,
            note: catatan || `Stage: ${stage}`,
            createdBy: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
            case_handover: "",
            status: gajamadaStatus,
            case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
            attachments: gajamadaAttachments.length > 0 ? gajamadaAttachments : undefined
          })

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

        if (!skipGajamada) {
          await callGajamada({
            report_id: prepetratorId,
            note: catatan || `Hasil: ${hasil}`,
            createdBy: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
            case_handover: "",
            status: gajamadaStatus,
            case_position: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
            attachments: gajamadaAttachments.length > 0 ? gajamadaAttachments : undefined
          })

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

        return NextResponse.json({ success: true, message: "Pelaporan selesai" })
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

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
