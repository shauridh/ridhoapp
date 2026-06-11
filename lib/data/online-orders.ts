import { createClient } from "@/lib/supabase/server"

export interface OnlineOrderRow {
  id: string
  nama: string
  phone: string
  alamat: string | null
  items: { name: string; qty: number; harga: number }[]
  catatan: string | null
  subtotal: number
  ongkir: number
  total: number
  status: "pending" | "confirmed" | "paid" | "done" | "cancelled"
  location_url: string | null
  created_at: string
}

// Daftar pesanan online aktif (belum selesai/batal) untuk panel kasir.
export async function listActiveOnlineOrders(): Promise<OnlineOrderRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("online_orders")
    .select("*")
    .in("status", ["pending", "confirmed", "paid"])
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}
