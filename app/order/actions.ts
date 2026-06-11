"use server"

import { createClient } from "@/lib/supabase/server"
import type { OnlineCartItem } from "@/lib/domain/online-order"

interface SubmitItem {
  productId: string
  qty: number
}

interface SubmitPayload {
  nama: string
  phone: string
  alamat: string
  catatan: string
  items: SubmitItem[]
  locationUrl: string
}

// Submit pesanan online dari halaman publik.
// Memakai RPC security-definer `create_online_order` yang menghitung harga &
// total dari tabel products (otoritatif), memaksa status='pending', dan
// membuat confirm_token di server. Anon tidak bisa memalsukan total/status.
export async function submitOnlineOrder(payload: SubmitPayload) {
  if (!payload.nama.trim() || !payload.phone.trim()) {
    return { ok: false as const, error: "Nama dan nomor HP wajib diisi" }
  }
  if (payload.items.length === 0) {
    return { ok: false as const, error: "Keranjang masih kosong" }
  }

  const supabase = await createClient()
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
  })
  if (error) return { ok: false as const, error: error.message }

  return { ok: true as const, orderId: data as string }
}

export type { OnlineCartItem }
