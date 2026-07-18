"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Trash2 } from "lucide-react"

interface Mapping {
  id: string; wujud: string; kategori: string; sub_kategori: string; pasal_ids: string[]
}

export default function PelanggaranMappingPage() {
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [loading, setLoading] = useState(true)

  const [newWujud, setNewWujud] = useState("")
  const [newKat, setNewKat] = useState("")
  const [newSub, setNewSub] = useState("")
  const [newPasal, setNewPasal] = useState("")

  useEffect(() => {
    fetch("/api/pelanggaran-mapping").then(r => r.json()).then(json => {
      setMappings((json.data ?? []) as Mapping[]); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function add() {
    if (!newWujud || !newKat) return
    const res = await fetch("/api/pelanggaran-mapping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wujud: newWujud, kategori: newKat, sub_kategori: newSub, pasal_ids: newPasal.split(",").map(s => s.trim()).filter(Boolean) }),
    })
    const json = await res.json()
    if (json.success) {
      setMappings(json.data ?? [])
      setNewWujud(""); setNewKat(""); setNewSub(""); setNewPasal("")
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus?")) return
    await fetch(`/api/pelanggaran-mapping?id=${id}`, { method: "DELETE" })
    setMappings(prev => prev.filter(m => m.id !== id))
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h2 className="text-xl font-bold text-white mb-3">Mapping Pelanggaran ({mappings.length})</h2>

      <div className="bg-[#0F172A] border border-gray-700 rounded-lg p-3 mb-4 flex-shrink-0">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <Input placeholder="Wujud Perbuatan" value={newWujud} onChange={e => setNewWujud(e.target.value)} className="bg-[#1E293B] border-gray-600 text-gray-200 h-8 text-xs" />
          <Input placeholder="Kategori" value={newKat} onChange={e => setNewKat(e.target.value)} className="bg-[#1E293B] border-gray-600 text-gray-200 h-8 text-xs" />
          <Input placeholder="Sub Kategori" value={newSub} onChange={e => setNewSub(e.target.value)} className="bg-[#1E293B] border-gray-600 text-gray-200 h-8 text-xs" />
          <Input placeholder="Pasal (koma)" value={newPasal} onChange={e => setNewPasal(e.target.value)} className="bg-[#1E293B] border-gray-600 text-gray-200 h-8 text-xs" />
        </div>
        <Button onClick={add} disabled={!newWujud || !newKat} className="bg-green-700 hover:bg-green-600 text-white h-8 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Tambah
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="py-2 w-[30%]">Wujud</th>
              <th className="py-2 w-[25%]">Kategori</th>
              <th className="py-2 w-[25%]">Sub Kategori</th>
              <th className="py-2 w-[15%]">Pasal</th>
              <th className="py-2 w-[5%]"></th>
            </tr>
          </thead>
          <tbody>
            {mappings.map(m => (
              <tr key={m.id} className="border-b border-gray-700/50 hover:bg-[#1E293B]/50">
                <td className="py-1.5 text-blue-300">{m.wujud}</td>
                <td className="py-1.5 text-gray-300">{m.kategori}</td>
                <td className="py-1.5 text-gray-400">{m.sub_kategori}</td>
                <td className="py-1.5 text-gray-400">{m.pasal_ids.join(", ")}</td>
                <td className="py-1.5">
                  <button onClick={() => remove(m.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mappings.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Belum ada mapping.</p>}
      </div>
    </div>
  )
}
