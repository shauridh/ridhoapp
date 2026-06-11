"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function addIngredient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const unit = String(formData.get("unit") ?? "").trim()
  const purchaseUnit = String(formData.get("purchaseUnit") ?? "").trim()
  const purchaseUnitQty = Number(formData.get("purchaseUnitQty") ?? 1)
  const lowStock = Number(formData.get("lowStockThreshold") ?? 0)
  const trackingType = String(
    formData.get("trackingType") ?? "ingredient",
  ) as "ingredient" | "finished"

  if (name.length === 0) {
    return { ok: false as const, error: "Nama bahan wajib diisi" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("ingredients").insert({
    name,
    unit,
    purchase_unit: purchaseUnit,
    purchase_unit_qty: purchaseUnitQty,
    low_stock_threshold: lowStock,
    tracking_type: trackingType,
  })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/inventory")
  return { ok: true as const }
}

// Catat pembelian/penyesuaian: buat stock_movements DAN update stock_qty bahan.
async function applyMovement(
  ingredientId: string,
  changeQty: number,
  reason: "purchase" | "adjustment" | "waste",
  note: string,
) {
  const supabase = await createClient()

  const { data: ing, error: readErr } = await supabase
    .from("ingredients")
    .select("stock_qty")
    .eq("id", ingredientId)
    .single()
  if (readErr) return { ok: false as const, error: readErr.message }

  const { error: moveErr } = await supabase.from("stock_movements").insert({
    ingredient_id: ingredientId,
    change_qty: changeQty,
    reason,
    note,
  })
  if (moveErr) return { ok: false as const, error: moveErr.message }

  const newQty = Number(ing.stock_qty) + changeQty
  const { error: updErr } = await supabase
    .from("ingredients")
    .update({ stock_qty: newQty })
    .eq("id", ingredientId)
  if (updErr) return { ok: false as const, error: updErr.message }

  revalidatePath("/inventory")
  return { ok: true as const }
}

export async function restock(formData: FormData) {
  const ingredientId = String(formData.get("ingredientId") ?? "")
  const qty = Number(formData.get("qty") ?? 0)
  const note = String(formData.get("note") ?? "").trim()
  if (!ingredientId || qty <= 0) {
    return { ok: false as const, error: "Pilih bahan dan jumlah > 0" }
  }
  return applyMovement(ingredientId, Math.abs(qty), "purchase", note)
}

export async function adjustStock(formData: FormData) {
  const ingredientId = String(formData.get("ingredientId") ?? "")
  const delta = Number(formData.get("delta") ?? 0)
  const reason = String(formData.get("reason") ?? "adjustment") as
    | "adjustment"
    | "waste"
  const note = String(formData.get("note") ?? "").trim()
  if (!ingredientId || delta === 0) {
    return { ok: false as const, error: "Pilih bahan dan selisih bukan 0" }
  }
  return applyMovement(ingredientId, delta, reason, note)
}
