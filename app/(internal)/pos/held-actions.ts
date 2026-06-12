"use server"

import { createClient } from "@/lib/supabase/server"
import { cartTotal, type Cart } from "@/lib/domain/cart"

// Simpan cart sebagai pesanan tersimpan (parkir).
export async function holdOrder(label: string, cart: Cart) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }
  if (cart.length === 0) return { ok: false as const, error: "Keranjang kosong" }

  const { error } = await supabase.from("held_orders").insert({
    label: label.trim() || "Tanpa nama",
    cart,
    total: cartTotal(cart),
    created_by: user.id,
  })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

// Hapus pesanan tersimpan (setelah dilanjutkan atau dibatalkan).
export async function deleteHeldOrder(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Tidak terautentikasi" }

  const { error } = await supabase.from("held_orders").delete().eq("id", id)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}
