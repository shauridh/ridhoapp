"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcOpnameDelta, parseBulkIngredients } from "@/lib/domain/opname";

export async function addIngredient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const purchaseUnit = String(formData.get("purchaseUnit") ?? "").trim();
  const purchaseUnitQty = Number(formData.get("purchaseUnitQty") ?? 1);
  const lowStock = Number(formData.get("lowStockThreshold") ?? 0);
  const trackingType = String(formData.get("trackingType") ?? "ingredient") as
    | "ingredient"
    | "finished";

  if (name.length === 0) {
    return { ok: false as const, error: "Nama bahan wajib diisi" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ingredients").insert({
    name,
    unit,
    purchase_unit: purchaseUnit,
    purchase_unit_qty: purchaseUnitQty,
    low_stock_threshold: lowStock,
    tracking_type: trackingType,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/inventory");
  return { ok: true as const };
}

export async function updateIngredient(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const purchaseUnit = String(formData.get("purchaseUnit") ?? "").trim();
  const purchaseUnitQty = Number(formData.get("purchaseUnitQty") ?? 1);
  const lowStock = Number(formData.get("lowStockThreshold") ?? 0);
  const trackingType = String(formData.get("trackingType") ?? "ingredient") as
    | "ingredient"
    | "finished";

  if (name.length === 0) {
    return { ok: false as const, error: "Nama bahan wajib diisi" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ingredients")
    .update({
      name,
      unit,
      purchase_unit: purchaseUnit,
      purchase_unit_qty: purchaseUnitQty,
      low_stock_threshold: lowStock,
      tracking_type: trackingType,
    })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/inventory");
  return { ok: true as const };
}

export async function deleteIngredient(id: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("recipe_lines")
    .select("id", { count: "exact", head: true })
    .eq("ingredient_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false as const,
      error: `Bahan tidak bisa dihapus karena masih dipakai ${count} resep.`,
    };
  }

  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/inventory");
  return { ok: true as const };
}

// Catat pembelian/penyesuaian: atomic delta update stock_qty + insert movement.
// Menggunakan RPC apply_stock_delta yang melakukan:
//   UPDATE ingredients SET stock_qty = stock_qty + delta  (atomic, no read-modify-write)
//   INSERT stock_movements
async function applyMovement(
  ingredientId: string,
  changeQty: number,
  reason: "purchase" | "adjustment" | "waste",
  note: string
) {
  const supabase = await createClient();

  // Auth check — defense in depth (RLS juga menjaga di DB level)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  const { error } = await supabase.rpc("apply_stock_delta", {
    p_ingredient_id: ingredientId,
    p_delta: changeQty,
    p_reason: reason,
    p_note: note,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/inventory");
  return { ok: true as const };
}

export async function restock(formData: FormData) {
  const ingredientId = String(formData.get("ingredientId") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  if (!ingredientId || qty <= 0) {
    return { ok: false as const, error: "Pilih bahan dan jumlah > 0" };
  }
  return applyMovement(ingredientId, Math.abs(qty), "purchase", note);
}

export async function adjustStock(formData: FormData) {
  const ingredientId = String(formData.get("ingredientId") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  const reason = String(formData.get("reason") ?? "adjustment") as "adjustment" | "waste";
  const note = String(formData.get("note") ?? "").trim();
  if (!ingredientId || delta === 0) {
    return { ok: false as const, error: "Pilih bahan dan selisih bukan 0" };
  }
  return applyMovement(ingredientId, delta, reason, note);
}

// Stok opname: kasir hitung fisik, sistem hitung selisih & catat sebagai adjustment.
export async function stockOpname(formData: FormData) {
  const ingredientId = String(formData.get("ingredientId") ?? "");
  const physicalQty = Number(formData.get("physicalQty") ?? 0);
  if (!ingredientId) {
    return { ok: false as const, error: "Pilih bahan" };
  }

  const supabase = await createClient();
  const { data: ing, error: readErr } = await supabase
    .from("ingredients")
    .select("stock_qty")
    .eq("id", ingredientId)
    .single();
  if (readErr) return { ok: false as const, error: readErr.message };

  const delta = calcOpnameDelta(Number(ing.stock_qty), physicalQty);
  if (delta === 0) {
    return { ok: true as const };
  }
  return applyMovement(ingredientId, delta, "adjustment", "Stok opname");
}

// Bulk import bahan dari teks CSV.
export async function bulkImportIngredients(text: string) {
  const rows = parseBulkIngredients(text);
  if (rows.length === 0) {
    return { ok: false as const, error: "Tidak ada baris valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ingredients").insert(
    rows.map((r) => ({
      name: r.name,
      unit: r.unit,
      purchase_unit: r.purchaseUnit,
      purchase_unit_qty: r.purchaseUnitQty,
      low_stock_threshold: r.lowStockThreshold,
      tracking_type: "ingredient" as const,
    }))
  );
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/inventory");
  return { ok: true as const, count: rows.length };
}
