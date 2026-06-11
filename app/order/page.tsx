import { createClient } from "@/lib/supabase/server"
import { OrderClient } from "./order-client"

export const dynamic = "force-dynamic"

export default async function PublicOrderPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category, base_price, image_url")
    .eq("is_active", true)
    .order("category")
    .order("name")

  const { data: settings } = await supabase.rpc("get_public_settings")
  const settingsMap = new Map<string, string>(
    (settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]),
  )

  const storeName = settingsMap.get("store_name") ?? "Sabana Fried Chicken"
  const ongkir = Number(settingsMap.get("ongkir") ?? "0")
  const enabled = (settingsMap.get("online_enabled") ?? "true") === "true"

  if (!enabled) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="text-4xl">🛑</div>
        <h1 className="mt-3 text-xl font-bold text-ink">Pesanan Online Tutup</h1>
        <p className="mt-2 text-ink-soft">
          Maaf, pemesanan online sedang tidak tersedia. Silakan datang langsung
          ke toko.
        </p>
      </div>
    )
  }

  return (
    <OrderClient
      products={products ?? []}
      storeName={storeName}
      ongkir={ongkir}
    />
  )
}
