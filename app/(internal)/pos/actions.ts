"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface CheckoutItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  variants: { variantId: string; variantName: string; priceDelta: number }[];
}

interface CheckoutPayload {
  items: CheckoutItem[];
  total: number;
  paymentMethod: "cash" | "qris";
}

export async function checkout(payload: CheckoutPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };

  if (payload.items.length === 0) {
    return { ok: false as const, error: "Keranjang kosong" };
  }

  // RPC transaksional: order + items + variants + pengurangan stok, atomik.
  const { data: order, error } = await supabase.rpc("create_order", {
    p_total: payload.total,
    p_payment_method: payload.paymentMethod,
    p_items: payload.items,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/pos");
  return { ok: true as const, order };
}

export async function voidOrder(orderId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };
  if (!reason.trim()) return { ok: false as const, error: "Alasan wajib diisi" };

  // RPC transaksional: ubah status + kembalikan stok + audit, atomik.
  const { error } = await supabase.rpc("void_order", {
    p_order_id: orderId,
    p_reason: reason,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  return { ok: true as const };
}

// Edit transaksi yang sudah selesai. Mendukung perbaikan total dan metode bayar
// (kasus paling umum: salah ketik / koreksi diskon). Untuk ubah item, lebih
// aman void + buat ulang karena menyangkut stok.
export async function editOrder(
  orderId: string,
  patch: { total?: number; paymentMethod?: "cash" | "qris" },
  reason: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" };
  if (!reason.trim()) return { ok: false as const, error: "Alasan wajib diisi" };

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return { ok: false as const, error: "Order tidak ditemukan" };
  if (order.status === "voided") {
    return { ok: false as const, error: "Order sudah dibatalkan" };
  }

  const update: Record<string, unknown> = {};
  if (typeof patch.total === "number" && patch.total >= 0) {
    update.total = patch.total;
  }
  if (patch.paymentMethod) {
    update.payment_method = patch.paymentMethod;
  }
  if (Object.keys(update).length === 0) {
    return { ok: false as const, error: "Tidak ada perubahan" };
  }

  const { error: updErr } = await supabase.from("orders").update(update).eq("id", orderId);
  if (updErr) return { ok: false as const, error: updErr.message };

  await supabase.from("order_edits").insert({
    order_id: orderId,
    edited_by: user.id,
    action: "edit",
    reason,
    before_snapshot: {
      total: order.total,
      payment_method: order.payment_method,
    },
    after_snapshot: update,
  });

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  return { ok: true as const };
}
