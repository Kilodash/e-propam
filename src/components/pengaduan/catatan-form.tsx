"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Send } from "lucide-react"

interface Props {
  pengaduanId: string
  prepetratorId: string
  authorEmail: string
  authorRole: string
}

export default function CatatanForm({ pengaduanId, prepetratorId, authorEmail, authorRole }: Props) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit() {
    if (!content.trim()) { setError("Catatan tidak boleh kosong"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/catatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pengaduan_id: pengaduanId,
          prepetrator_id: prepetratorId,
          author_email: authorEmail,
          author_role: authorRole,
          content,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setContent("")
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
        placeholder="Tulis catatan..."
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0369A1]"
        disabled={loading}
      />
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-[#0369A1] hover:bg-[#0284c7] text-white h-9 px-4"
      >
        {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
        Kirim
      </Button>
      {error && <p className="text-red-500 text-xs ml-2">{error}</p>}
    </div>
  )
}
