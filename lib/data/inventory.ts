import { createClient } from "@/lib/supabase/server"

export interface IngredientRow {
  id: string
  name: string
  tracking_type: "ingredient" | "finished"
  stock_qty: number
  unit: string
  purchase_unit: string
  purchase_unit_qty: number
  low_stock_threshold: number
  created_at: string
}

export async function listIngredients(): Promise<IngredientRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export interface UsageRow {
  ingredient_id: string
  total_used: number
}

// Total pemakaian (reason='sale') sejak tanggal tertentu, per bahan.
export async function usageSince(sinceIso: string): Promise<UsageRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("stock_movements")
    .select("ingredient_id, change_qty")
    .eq("reason", "sale")
    .gte("created_at", sinceIso)
  if (error) throw new Error(error.message)

  const totals = new Map<string, number>()
  for (const row of data ?? []) {
    const used = Math.abs(Number(row.change_qty))
    totals.set(row.ingredient_id, (totals.get(row.ingredient_id) ?? 0) + used)
  }
  return Array.from(totals.entries()).map(([ingredient_id, total_used]) => ({
    ingredient_id,
    total_used,
  }))
}
