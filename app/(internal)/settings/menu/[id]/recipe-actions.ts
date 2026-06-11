"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// Pastikan ada resep "hari ini" untuk produk; kembalikan recipe_id.
// Jika resep terbaru sudah effective_from = hari ini, pakai itu.
// Jika belum ada / versi lama, buat versi baru effective_from = hari ini
// dan salin baris dari versi terakhir (agar edit bersifat inkremental).
async function ensureTodayRecipe(productId: string): Promise<
  { ok: true; recipeId: string } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date().toISOString().slice(0, 10)

  const { data: latest } = await supabase
    .from("recipes")
    .select("id, effective_from")
    .eq("product_id", productId)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest && latest.effective_from === today) {
    return { ok: true, recipeId: latest.id }
  }

  const { data: created, error } = await supabase
    .from("recipes")
    .insert({
      product_id: productId,
      effective_from: today,
      created_by: user?.id ?? null,
      note: "",
    })
    .select("id")
    .single()
  if (error) return { ok: false, error: error.message }

  // Salin baris dari versi sebelumnya bila ada.
  if (latest) {
    const { data: prevLines } = await supabase
      .from("recipe_lines")
      .select("ingredient_id, qty_used")
      .eq("recipe_id", latest.id)
    if (prevLines && prevLines.length > 0) {
      await supabase.from("recipe_lines").insert(
        prevLines.map((l) => ({
          recipe_id: created.id,
          ingredient_id: l.ingredient_id,
          qty_used: l.qty_used,
        })),
      )
    }
  }

  return { ok: true, recipeId: created.id }
}

export async function addRecipeLine(formData: FormData) {
  const productId = String(formData.get("productId") ?? "")
  const ingredientId = String(formData.get("ingredientId") ?? "")
  const qtyUsed = Number(formData.get("qtyUsed") ?? 0)

  if (!productId || !ingredientId || qtyUsed <= 0) {
    return { ok: false as const, error: "Pilih bahan dan qty > 0" }
  }

  const ensured = await ensureTodayRecipe(productId)
  if (!ensured.ok) return { ok: false as const, error: ensured.error }

  const supabase = await createClient()
  const { error } = await supabase.from("recipe_lines").insert({
    recipe_id: ensured.recipeId,
    ingredient_id: ingredientId,
    qty_used: qtyUsed,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath(`/settings/menu/${productId}`)
  return { ok: true as const }
}

export async function removeRecipeLine(lineId: string, productId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("recipe_lines")
    .delete()
    .eq("id", lineId)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath(`/settings/menu/${productId}`)
  return { ok: true as const }
}
