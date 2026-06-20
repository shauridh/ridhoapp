"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendWa, sendWaMedia } from "@/lib/wa/getsender";
import { formatReceiptMessage } from "@/lib/wa/format-receipt";
import { generateReceiptPng } from "@/lib/wa/receipt-image";

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

interface SendReceiptPayload {
  orderId: string;
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
  paid?: number;
  change?: number;
  // Store info dikirim dari client agar tidak perlu re-fetch dari DB
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptFooter?: string;
}

const RECEIPT_BUCKET = "produk-images";

/**
 * Mengirim struk transaksi ke nomor WhatsApp pelanggan sebagai gambar PNG.
 * Fallback ke teks jika generate/upload gambar gagal.
 * Best-effort: tidak melempar error, mengembalikan { ok, error? }.
 */
export async function sendReceiptWa(
  phone: string,
  receiptData: SendReceiptPayload
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tidak terautentikasi" };

  const { storeName, storeAddress, storePhone, receiptFooter, ...receiptFields } = receiptData;
  const storeNameResolved = storeName ?? "Sabana POS";

  // Normalisasi nomor: 08xx → 628xx, +628xx → 628xx
  const normalized = phone.replace(/^\+/, "").replace(/^0/, "62");

  // ── Coba kirim sebagai gambar PNG via Satori (font lokal, tidak ada CDN) ──
  try {
    const pngBuffer = await generateReceiptPng({
      storeName: storeNameResolved,
      storeAddress: storeAddress || undefined,
      storePhone: storePhone || undefined,
      receiptFooter: receiptFooter || undefined,
      ...receiptFields,
    });

    // Upload ke Supabase Storage (file sementara, path unik per transaksi)
    const filePath = `receipts/${receiptData.orderId}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .upload(filePath, pngBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from(RECEIPT_BUCKET).getPublicUrl(filePath);

      const result = await sendWaMedia(normalized, urlData.publicUrl);

      // Hapus file setelah terkirim (best-effort, tidak blocking)
      supabase.storage
        .from(RECEIPT_BUCKET)
        .remove([filePath])
        .catch(() => {});

      if (result.ok) return result;
      // Jika kirim media gagal, jatuh ke fallback teks di bawah
    }
  } catch {
    // Generate atau upload gagal — lanjut ke fallback teks
  }

  // ── Fallback: kirim sebagai teks ──
  const message = formatReceiptMessage({
    storeName: storeNameResolved,
    storeAddress: storeAddress || undefined,
    storePhone: storePhone || undefined,
    ...receiptFields,
  });
  console.log("[sendReceiptWa] falling back to text, phone:", normalized);
  return sendWa(normalized, message);
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
