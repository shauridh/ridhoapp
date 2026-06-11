"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { selectActiveRecipe, type RecipeVersion } from "@/lib/domain/inventory"
import { calcStockDeductions } from "@/lib/domain/inventory"

interface CheckoutItem {
  productId: string
  productName: string
  qty: number
  unitPrice: number
  variants: { variantId: string; variantName: string; priceDelta: number }[]
}

interface CheckoutPayload {
  items: CheckoutItem[]
  total: number
  paymentMethod: "cash" | "qris"
}

export async function checkout(payload: CheckoutPayload) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  if (payload.items.length === 0) {
    return { ok: false as const, error: "Keranjang kosong" }
  }

  const { data: shift } = await supabase
    .from("shifts")
    .select("id")
    .eq("status", "open")
    .maybeSingle()

  // 1. Buat order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      shift_id: shift?.id,
      total: payload.total,
      payment_method: payload.paymentMethod,
      source: "cashier",
      status: "completed",
      created_by: user.id,
    })
    .select("id")
    .single()
  if (orderErr) return { ok: false as const, error: orderErr.message }

  // 2. Buat order_items + order_item_variants, kumpulkan productId + qty
  const productQtyMap = new Map<string, number>()

  for (const item of payload.items) {
    const { data: oi, error: oiErr } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        qty: item.qty,
        unit_price: item.unitPrice,
        subtotal:
          (item.unitPrice +
            item.variants.reduce((s, v) => s + v.priceDelta, 0)) *
          item.qty,
      })
      .select("id")
      .single()
    if (oiErr) return { ok: false as const, error: oiErr.message }

    for (const v of item.variants) {
      await supabase.from("order_item_variants").insert({
        order_item_id: oi.id,
        variant_id: v.variantId,
        variant_name: v.variantName,
        price_delta: v.priceDelta,
      })
    }

    productQtyMap.set(
      item.productId,
      (productQtyMap.get(item.productId) ?? 0) + item.qty,
    )
  }

  // 3. Kurangi stok via resep aktif
  const now = new Date().toISOString().slice(0, 10)
  for (const [productId, totalQty] of productQtyMap) {
    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, effective_from")
      .eq("product_id", productId)

    if (!recipes || recipes.length === 0) continue

    const recipeVersions = recipes.map((r) => ({
      id: r.id,
      effectiveFrom: r.effective_from,
      lines: [] as { ingredientId: string; qtyUsed: number }[],
    }))
    const activeRecipe = selectActiveRecipe(recipeVersions, now)
    if (!activeRecipe) continue

    const { data: lines } = await supabase
      .from("recipe_lines")
      .select("ingredient_id, qty_used")
      .eq("recipe_id", activeRecipe.id)
    if (!lines || lines.length === 0) continue

    const recipeWithLines: RecipeVersion = {
      id: activeRecipe.id,
      effectiveFrom: activeRecipe.effectiveFrom,
      lines: lines.map((l) => ({
        ingredientId: l.ingredient_id,
        qtyUsed: l.qty_used,
      })),
    }

    const deductions = calcStockDeductions(recipeWithLines, totalQty)

    for (const d of deductions) {
      const { data: ing } = await supabase
        .from("ingredients")
        .select("stock_qty")
        .eq("id", d.ingredientId)
        .single()
      if (!ing) continue

      await supabase.from("stock_movements").insert({
        ingredient_id: d.ingredientId,
        change_qty: d.changeQty,
        reason: "sale",
        ref_id: order.id,
        note: `Penjualan ${totalQty} porsi`,
        created_by: user.id,
      })

      const newQty = Number(ing.stock_qty) + d.changeQty
      await supabase
        .from("ingredients")
        .update({ stock_qty: newQty })
        .eq("id", d.ingredientId)
    }
  }

  const { data: fullOrder } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order.id)
    .single()

  revalidatePath("/pos")
  return { ok: true as const, order: fullOrder }
}

export async function voidOrder(orderId: string, reason: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }
  if (!reason.trim()) return { ok: false as const, error: "Alasan wajib diisi" }

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single()
  if (!order) return { ok: false as const, error: "Order tidak ditemukan" }
  if (order.status === "voided") {
    return { ok: false as const, error: "Order sudah dibatalkan" }
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, qty")
    .eq("order_id", orderId)

  const { error: updErr } = await supabase
    .from("orders")
    .update({ status: "voided", void_reason: reason })
    .eq("id", orderId)
  if (updErr) return { ok: false as const, error: updErr.message }

  const now = new Date().toISOString().slice(0, 10)
  const productQtyMap = new Map<string, number>()
  for (const item of items ?? []) {
    productQtyMap.set(
      item.product_id,
      (productQtyMap.get(item.product_id) ?? 0) + item.qty,
    )
  }

  for (const [productId, totalQty] of productQtyMap) {
    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, effective_from")
      .eq("product_id", productId)
    if (!recipes || recipes.length === 0) continue

    const activeRecipe = selectActiveRecipe(
      recipes.map((r) => ({
        id: r.id,
        effectiveFrom: r.effective_from,
        lines: [] as { ingredientId: string; qtyUsed: number }[],
      })),
      now,
    )
    if (!activeRecipe) continue

    const { data: lines } = await supabase
      .from("recipe_lines")
      .select("ingredient_id, qty_used")
      .eq("recipe_id", activeRecipe.id)
    if (!lines || lines.length === 0) continue

    const recipeWithLines: RecipeVersion = {
      id: activeRecipe.id,
      effectiveFrom: activeRecipe.effectiveFrom,
      lines: lines.map((l) => ({
        ingredientId: l.ingredient_id,
        qtyUsed: l.qty_used,
      })),
    }

    const deductions = calcStockDeductions(recipeWithLines, totalQty)
    for (const d of deductions) {
      const { data: ing } = await supabase
        .from("ingredients")
        .select("stock_qty")
        .eq("id", d.ingredientId)
        .single()
      if (!ing) continue

      const restore = Math.abs(d.changeQty)
      await supabase.from("stock_movements").insert({
        ingredient_id: d.ingredientId,
        change_qty: restore,
        reason: "adjustment",
        ref_id: orderId,
        note: `Void order: ${reason}`,
        created_by: user.id,
      })

      const newQty = Number(ing.stock_qty) + restore
      await supabase
        .from("ingredients")
        .update({ stock_qty: newQty })
        .eq("id", d.ingredientId)
    }
  }

  await supabase.from("order_edits").insert({
    order_id: orderId,
    edited_by: user.id,
    action: "void",
    reason,
    before_snapshot: { order, items },
    after_snapshot: { status: "voided" },
  })

  revalidatePath("/pos")
  return { ok: true as const }
}
