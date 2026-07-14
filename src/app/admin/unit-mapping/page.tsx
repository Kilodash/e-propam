import type { UnitMapping } from "@/types"

const DEV_MAPPINGS: UnitMapping[] = [
  { id: 1, gajamada_name: "KASUBBAG YANDUAN POLDA JAWA BARAT", normalized_name: "Kasubbag Yanduan Polda Jabar", police_function: "YANDUAN", satker_level: "subbag" },
  { id: 2, gajamada_name: "KANIT PAMINAL POLRES SUKABUMI POLDA JAWA BARAT", normalized_name: "Kanit Paminal Polres Sukabumi", police_function: "PAMINAL", satker_level: "polres" },
  { id: 3, gajamada_name: "UNIT 2 SUBBID PAMINAL POLDA JAWA BARAT", normalized_name: "Unit 2 Subbid Paminal Polda Jabar", police_function: "PAMINAL", satker_level: "subbid" },
  { id: 4, gajamada_name: "KASIPROVOS SATBRIMOB POLDA JAWA BARAT", normalized_name: "Kasiprovos Satbrimob Polda Jabar", police_function: "PROVOS", satker_level: "polres" },
  { id: 5, gajamada_name: "KAUR YANDUAN POLRESTA BANDUNG POLDA JAWA BARAT", normalized_name: "Kaur Yanduan Polresta Bandung", police_function: "YANDUAN", satker_level: "polres" },
]

export default function UnitMappingPage() {
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
            {DEV_MAPPINGS.map((m) => (
              <tr key={m.id} className="border-b border-gray-700 last:border-0">
                <td className="p-3 text-gray-200 font-mono text-xs">{m.gajamada_name}</td>
                <td className="p-3 text-gray-300">{m.normalized_name}</td>
                <td className="p-3 text-gray-400">{m.police_function ?? "-"}</td>
                <td className="p-3 text-gray-400">{m.satker_level ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
