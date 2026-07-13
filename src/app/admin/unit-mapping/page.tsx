import { createServerClient } from "@/lib/supabase/server"
import type { UnitMapping } from "@/types"

export default async function UnitMappingPage() {
  const supabase = await createServerClient()

  const { data: mappings, error } = await supabase
    .from("unit_mapping")
    .select("*")
    .order("gajamada_name")

  if (error) {
    return <p className="text-red-400">Error: {error.message}</p>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Normalisasi Nama Unit</h2>
      <div className="bg-[#0F172A] rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="text-gray-300 font-medium p-3">Nama Gajamada</th>
              <th className="text-gray-300 font-medium p-3">Normalisasi</th>
              <th className="text-gray-300 font-medium p-3">Fungsi</th>
              <th className="text-gray-300 font-medium p-3">Level</th>
            </tr>
          </thead>
          <tbody>
            {!mappings || mappings.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-6">
                  Belum ada mapping
                </td>
              </tr>
            ) : (
              (mappings as UnitMapping[]).map((m) => (
                <tr key={m.id} className="border-b border-gray-700 last:border-0">
                  <td className="p-3 text-gray-200 font-mono text-xs">{m.gajamada_name}</td>
                  <td className="p-3 text-gray-300">{m.normalized_name}</td>
                  <td className="p-3 text-gray-400">{m.police_function ?? "-"}</td>
                  <td className="p-3 text-gray-400">{m.satker_level ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
