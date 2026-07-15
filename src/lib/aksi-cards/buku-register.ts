import { createServiceClient } from "@/lib/supabase/server"

export async function getNextRegisterNumber(
  unit: string,
  docType: string,
  year: number
): Promise<number> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("buku_register")
    .select("last_number")
    .eq("unit", unit)
    .eq("doc_type", docType)
    .eq("year", year)
    .maybeSingle()

  if (error || !data) return 1
  return data.last_number + 1
}

export async function incrementRegister(
  unit: string,
  docType: string,
  year: number
): Promise<{ nextNumber: number; lastNumber: number }> {
  const supabase = createServiceClient()
  const nextNumber = await getNextRegisterNumber(unit, docType, year)

  const { data: existing } = await supabase
    .from("buku_register")
    .select("id")
    .eq("unit", unit)
    .eq("doc_type", docType)
    .eq("year", year)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("buku_register")
      .update({ last_number: nextNumber, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
  } else {
    await supabase
      .from("buku_register")
      .insert({ unit, doc_type: docType, year, last_number: nextNumber })
  }

  return { nextNumber, lastNumber: nextNumber }
}
