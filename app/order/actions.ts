"use server";

import { createClient } from "@/lib/supabase/server";
import type { OnlineCartItem } from "@/lib/domain/online-order";
import { sendWa } from "@/lib/wa/getsender";
import { formatNewOrderOwnerNotif } from "@/lib/wa/format-online-order";

interface SubmitItem {
  productId: string;
  qty: number;
}

interface SubmitPayload {
  nama: string;
  phone: string;
  alamat: string;
  catatan: string;
  items: SubmitItem[];
  locationUrl: string;
}

// Submit pesanan online dari halaman publik.
// Memakai RPC security-definer `create_online_order` yang menghitung harga &
// total dari tabel products (otoritatif), memaksa status='pending', dan
// membuat confirm_token di server. Anon tidak bisa memalsukan total/status.
export async function submitOnlineOrder(payload: SubmitPayload) {
  if (!payload.nama.trim() || !payload.phone.trim()) {
    return { ok: false as const, error: "Nama dan nomor HP wajib diisi" };
  }
  if (payload.items.length === 0) {
    return { ok: false as const, error: "Keranjang masih kosong" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_online_order", {
    p_nama: payload.nama.trim(),
    p_phone: payload.phone.trim(),
    p_alamat: payload.alamat.trim(),
    p_catatan: payload.catatan.trim(),
    p_items: payload.items.map((i) => ({
      product_id: i.productId,
      qty: i.qty,
    })),
    p_location_url: payload.locationUrl.trim(),
  });
  if (error) return { ok: false as const, error: error.message };

  const orderId = data as string;

  // Kirim notif WA ke owner & pelanggan secara paralel (best-effort, tidak blocking)
  void notifyNewOrder(payload, orderId).catch(() => {});

  return { ok: true as const, orderId };
}

async function notifyNewOrder(payload: SubmitPayload, orderId: string) {
  const supabase = await createClient();

  // Ambil detail order yang baru dibuat (dengan harga dari DB)
  const [orderResult, settingsResult] = await Promise.all([
    supabase
      .from("online_orders")
      .select("nama, phone, alamat, catatan, items, subtotal, ongkir, total, created_at")
      .eq("id", orderId)
      .single(),
    supabase.from("app_settings").select("key, value").in("key", ["store_name", "owner_wa"]),
  ]);

  if (orderResult.error || !orderResult.data) return;
  const order = orderResult.data;
  const settings = new Map((settingsResult.data ?? []).map((r) => [r.key, r.value]));
  const storeName = settings.get("store_name") ?? "Toko";
  const ownerWa = settings.get("owner_wa");

  const notifData = {
    storeName,
    orderId,
    nama: order.nama,
    phone: order.phone,
    alamat: order.alamat,
    catatan: order.catatan,
    items: order.items as { name: string; qty: number; harga: number }[],
    subtotal: Number(order.subtotal),
    ongkir: Number(order.ongkir),
    total: Number(order.total),
    createdAt: order.created_at,
  };

  const ownerMsg = formatNewOrderOwnerNotif(notifData);

  // Notif ke owner
  if (ownerWa) {
    const ownerNumber = ownerWa.replace(/^\+/, "").replace(/^0/, "62");
    await sendWa(ownerNumber, ownerMsg);
  }

  // Konfirmasi penerimaan ke pelanggan
  if (payload.phone) {
    const custNumber = payload.phone.replace(/^\+/, "").replace(/^0/, "62");
    const custMsg = [
      `✅ *Pesanan diterima, ${order.nama.split(" ")[0]}!*`,
      `Kami sudah terima pesananmu di *${storeName}*.`,
      `Total: *Rp ${Number(order.total).toLocaleString("id-ID")}*`,
      `\nKasir akan segera konfirmasi. Tunggu sebentar ya! 🙏`,
    ].join("\n");
    await sendWa(custNumber, custMsg);
  }
}

export type { OnlineCartItem };
