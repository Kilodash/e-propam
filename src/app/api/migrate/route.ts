import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getRules } from "@/lib/status-category"

const UNIT_SEED = [
  // KABID PROPAM
  { gajamada_name: "KABID PROPAM POLDA JAWA BARAT", normalized_name: "Kabid Propam", police_function: null, satker_level: "kabid", sort_order: 1 },
  // SUBBAG YANDUAN (KASUBBAG + OPERATOR)
  { gajamada_name: "KASUBBAG YANDUAN POLDA JAWA BARAT", normalized_name: "Subbag Yanduan", police_function: "YANDUAN", satker_level: "subbag", sort_order: 11 },
  { gajamada_name: "OPERATOR YANDUAN POLDA JAWA BARAT", normalized_name: "Subbag Yanduan", police_function: "YANDUAN", satker_level: "subbag", sort_order: 11 },
  // SUBBAG REHABPERS (belum ada data)
  { gajamada_name: "KASUBBAG REHABPERS POLDA JAWA BARAT", normalized_name: "Subbag Rehabpers", police_function: "REHABPERS", satker_level: "subbag", sort_order: 12, is_active_initial: false },
  // SUBBID PAMINAL (KASUBBID + UNIT PAMINAL POLDA)
  { gajamada_name: "KASUBBID PAMINAL POLDA JAWA BARAT", normalized_name: "Subbid Paminal", police_function: "PAMINAL", satker_level: "subbid", sort_order: 21 },
  { gajamada_name: "KAUR BINPAM SUBBID PAMINAL POLDA JAWA BARAT", normalized_name: "Subbid Paminal", police_function: "PAMINAL", satker_level: "subbid", sort_order: 21 },
  { gajamada_name: "UR BINPAM SUBBID PAMINAL POLDA JAWA BARAT", normalized_name: "Subbid Paminal", police_function: "PAMINAL", satker_level: "subbid", sort_order: 21 },
  { gajamada_name: "UR BINPAM SUBBID PAMINAL JAWA BARAT", normalized_name: "Subbid Paminal", police_function: "PAMINAL", satker_level: "subbid", sort_order: 21 },
  { gajamada_name: "UNIT 2 SUBBID PAMINAL POLDA JAWA BARAT", normalized_name: "Subbid Paminal", police_function: "PAMINAL", satker_level: "subbid", sort_order: 21 },
  { gajamada_name: "UNIT 3 SUBBID PAMINAL POLDA JAWA BARAT", normalized_name: "Subbid Paminal", police_function: "PAMINAL", satker_level: "subbid", sort_order: 21 },
  // SUBBID PROVOS (KASUBBID + UNIT PROVOS POLDA)
  { gajamada_name: "KASUBBID PROVOS POLDA JAWA BARAT", normalized_name: "Subbid Provos", police_function: "PROVOS", satker_level: "subbid", sort_order: 22 },
  // SUBBID WABPROF (KASUBBID + UNIT WABPROF POLDA)
  { gajamada_name: "KASUBBID WABPROF POLDA JAWA BARAT", normalized_name: "Subbid Wabprof", police_function: "WABPROF", satker_level: "subbid", sort_order: 23 },
  // POLRESTABES
  { gajamada_name: "KASIPROPAM POLRESTABES BANDUNG POLDA JAWA BARAT", normalized_name: "Polrestabes Bandung", police_function: "POLRES", satker_level: "tabes", sort_order: 31 },
  { gajamada_name: "KANIT PAMINAL POLRESTABES BANDUNG POLDA JAWA BARAT", normalized_name: "Polrestabes Bandung", police_function: "POLRES", satker_level: "tabes", sort_order: 31 },
  // POLRESTA
  { gajamada_name: "KASIPROPAM POLRESTA BANDUNG POLDA JAWA BARAT", normalized_name: "Polresta Bandung", police_function: "POLRES", satker_level: "polres", sort_order: 41 },
  { gajamada_name: "KASIPROPAM POLRESTA BOGOR KOTA POLDA JAWA BARAT", normalized_name: "Polresta Bogor Kota", police_function: "POLRES", satker_level: "polres", sort_order: 42 },
  { gajamada_name: "KASIPROPAM POLRESTA CIREBON POLDA JAWA BARAT", normalized_name: "Polresta Cirebon", police_function: "POLRES", satker_level: "polres", sort_order: 43 },
  { gajamada_name: "KASIPROPAM POLRESTA KARAWANG POLDA JAWA BARAT", normalized_name: "Polresta Karawang", police_function: "POLRES", satker_level: "polres", sort_order: 44 },
  { gajamada_name: "KASIPROPAM POLRESTA SUKABUMI POLDA JAWA BARAT", normalized_name: "Polresta Sukabumi", police_function: "POLRES", satker_level: "polres", sort_order: 45 },
  // POLRES
  { gajamada_name: "KASIPROPAM POLRES BANDUNG BARAT POLDA JAWA BARAT", normalized_name: "Polres Cimahi", police_function: "POLRES", satker_level: "polres", sort_order: 51 },
  { gajamada_name: "KASIPROPAM POLRES BANJAR POLDA JAWA BARAT", normalized_name: "Polres Banjar", police_function: "POLRES", satker_level: "polres", sort_order: 52 },
  { gajamada_name: "KANIT PAMINAL POLRES BANJAR KOTA POLDA JAWA BARAT", normalized_name: "Polres Banjar", police_function: "POLRES", satker_level: "polres", sort_order: 52 },
  { gajamada_name: "KASIPROPAM POLRES BOGOR POLDA JAWA BARAT", normalized_name: "Polres Bogor", police_function: "POLRES", satker_level: "polres", sort_order: 53 },
  { gajamada_name: "KAUR YANDUAN POLRES BOGOR POLDA JAWA BARAT", normalized_name: "Polres Bogor", police_function: "POLRES", satker_level: "polres", sort_order: 53 },
  { gajamada_name: "KANIT PAMINAL POLRES CIANJUR POLDA JAWA BARAT", normalized_name: "Polres Cianjur", police_function: "POLRES", satker_level: "polres", sort_order: 54 },
  { gajamada_name: "KASIPROPAM POLRES CIAMIS POLDA JAWA BARAT", normalized_name: "Polres Ciamis", police_function: "POLRES", satker_level: "polres", sort_order: 55 },
  { gajamada_name: "KANIT PAMINAL POLRES CIREBON KOTA POLDA JAWA BARAT", normalized_name: "Polres Cirebon Kota", police_function: "POLRES", satker_level: "polres", sort_order: 56 },
  { gajamada_name: "KASIPROPAM POLRES GARUT POLDA JAWA BARAT", normalized_name: "Polres Garut", police_function: "POLRES", satker_level: "polres", sort_order: 57 },
  { gajamada_name: "KASIPROPAM POLRES INDRAMAYU POLDA JAWA BARAT", normalized_name: "Polres Indramayu", police_function: "POLRES", satker_level: "polres", sort_order: 58 },
  { gajamada_name: "KASIPROPAM POLRES KUNINGAN POLDA JAWA BARAT", normalized_name: "Polres Kuningan", police_function: "POLRES", satker_level: "polres", sort_order: 59 },
  { gajamada_name: "KASIPROPAM POLRES MAJALENGKA POLDA JAWA BARAT", normalized_name: "Polres Majalengka", police_function: "POLRES", satker_level: "polres", sort_order: 60 },
  { gajamada_name: "KASIPROPAM POLRES PANGANDARAN POLDA JAWA BARAT", normalized_name: "Polres Pangandaran", police_function: "POLRES", satker_level: "polres", sort_order: 61 },
  { gajamada_name: "KASIPROPAM POLRES PURWAKARTA POLDA JAWA BARAT", normalized_name: "Polres Purwakarta", police_function: "POLRES", satker_level: "polres", sort_order: 62 },
  { gajamada_name: "KASIPROPAM POLRES SUBANG POLDA JAWA BARAT", normalized_name: "Polres Subang", police_function: "POLRES", satker_level: "polres", sort_order: 63 },
  { gajamada_name: "KASIPROPAM POLRES SUKABUMI POLDA JAWA BARAT", normalized_name: "Polres Sukabumi", police_function: "POLRES", satker_level: "polres", sort_order: 64 },
  { gajamada_name: "KASIPROPAM POLRES SUMEDANG POLDA JAWA BARAT", normalized_name: "Polres Sumedang", police_function: "POLRES", satker_level: "polres", sort_order: 65 },
  { gajamada_name: "KASIPROPAM POLRES TASIKMALAYA POLDA JAWA BARAT", normalized_name: "Polres Tasikmalaya", police_function: "POLRES", satker_level: "polres", sort_order: 66 },
  { gajamada_name: "KASIPROPAM POLRES TASIKMALAYA KOTA POLDA JAWA BARAT", normalized_name: "Polres Tasikmalaya Kota", police_function: "POLRES", satker_level: "polres", sort_order: 67 },
  { gajamada_name: "KASIPROPAM POLRES SUKABUMI KOTA POLDA JAWA BARAT", normalized_name: "Polres Sukabumi Kota", police_function: "POLRES", satker_level: "polres", sort_order: 68 },
  // SATBRIMOB
  { gajamada_name: "KASIPROVOS SATBRIMOB POLDA JAWA BARAT", normalized_name: "Satbrimob", police_function: "PROVOS", satker_level: "brimob", sort_order: 71 },
  // DITPOLAIR
  { gajamada_name: "KANIT PAMINAL DITPOLAIR POLDA JAWA BARAT", normalized_name: "Ditpolair", police_function: "POLAIR", satker_level: "ditpolair", sort_order: 81 },
  // WASSIDIK
  { gajamada_name: "WASSIDIK DITRESKRIMUM POLDA JAWA BARAT", normalized_name: "Wassidik", police_function: "WASSIDIK", satker_level: "wassidik", sort_order: 91 },
  { gajamada_name: "BAG WASSIDIK POLDA JAWA BARAT", normalized_name: "Bag Wassidik", police_function: "WASSIDIK", satker_level: "wassidik", sort_order: 92 },
]

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  // Delete + re-seed unit_mapping
  await supabase.from("unit_mapping").delete().neq("id", 0)

  for (const row of UNIT_SEED) {
    const { sort_order, is_active_initial, ...rest } = row
    const { error } = await supabase.from("unit_mapping").insert({
      ...rest,
      source: "seed",
      is_active: is_active_initial ?? true,
    })
    if (error) {
      return NextResponse.json({ success: false, error: error.message, at: row.gajamada_name }, { status: 500 })
    }
  }

  // Delete + re-seed status_mapping
  await supabase.from("status_mapping").delete().neq("id", 0)

  const rules = getRules()
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const { error } = await supabase.from("status_mapping").insert({
      gajamada_status: rule.pattern,
      gajamada_pattern: rule.pattern,
      epropam_label: rule.label,
      category: rule.category,
      direction: "both",
      sort_order: i,
    })
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, units: UNIT_SEED.length, statuses: rules.length })
}
