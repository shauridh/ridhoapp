import { createClient } from "@/lib/supabase/server"

export interface RecipeLineRow {
  id: string
  ingredient_id: string
  ingredient_name: string
  qty_used: number
  unit: string
}

export interface ActiveRecipe {
  id: string
  effective_from: string
  note: string
  lines: RecipeLineRow[]
}

// Ambil resep aktif terbaru (effective_from terbesar) untuk sebuah produk,
// beserta baris bahannya. Null jika belum ada resep.
export async function getLatestRecipe(
  productId: string,
): Promise<ActiveRecipe | null> {
  const supabase = await createClient()

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("id, effective_from, note")
    .eq("product_id", productId)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!recipe) return null

  const { data: lines, error: linesErr } = await supabase
    .from("recipe_lines")
    .select("id, ingredient_id, qty_used, ingredients(name, unit)")
    .eq("recipe_id", recipe.id)
  if (linesErr) throw new Error(linesErr.message)

  return {
    id: recipe.id,
    effective_from: recipe.effective_from,
    note: recipe.note,
    lines: (lines ?? []).map((l) => {
      const ing = l.ingredients as unknown as { name: string; unit: string } | null
      return {
        id: l.id,
        ingredient_id: l.ingredient_id,
        ingredient_name: ing?.name ?? "?",
        qty_used: Number(l.qty_used),
        unit: ing?.unit ?? "",
      }
    }),
  }
}
