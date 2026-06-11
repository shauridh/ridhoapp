"use server"

import { createClient } from "@/lib/supabase/server"
import { calcOrderTotal, type OnlineCartItem } from "@/lib/domain/online-order"

interface SubmitPayload {
  nama: string
  phone: string
  alamat: string
  catatan: string
  items: OnlineCartItem[]
  ongkir: number
  locationUrl: string
}

// Submit pesanan online dari halaman publik. Memakai anon client (RLS
// mengizinkan anon INSERT ke online_orders saja).
export async function submitOnlineOrder(payload: SubmitPayload) {
  if (!payload.nama.trim() || !payload.phone.trim()) {
    return { ok: false as const, error: "Nama dan nomor HP wajib diisi" }
  }
  if (payload.items.length === 0) {
    return { ok: false as const, error: "Keranjang masih kosong" }
  }

  const { subtotal, total } = calcOrderTotal(payload.items, payload.ongkir)
  const confirmToken = crypto.randomUUID()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("online_orders")
    .insert({
      nama: payload.nama.trim(),
      phone: payload.phone.trim(),
      alamat: payload.alamat.trim() || null,
      catatan: payload.catatan.trim() || null,
      items: payload.items,
      subtotal,
      ongkir: payload.ongkir,
      total,
      status: "pending",
      confirm_token: confirmToken,
      location_url: payload.locationUrl.trim() || null,
    })
    .select("id")
    .single()
  if (error) return { ok: false as const, error: error.message }

  return { ok: true as const, orderId: data.id }
}
