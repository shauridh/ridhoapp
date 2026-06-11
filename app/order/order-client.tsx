"use client"

import { useState } from "react"
import { Plus, Minus, ShoppingBag, MapPin } from "lucide-react"
import { submitOnlineOrder } from "./actions"
import { calcOrderTotal, type OnlineCartItem } from "@/lib/domain/online-order"

interface PublicProduct {
  id: string
  name: string
  category: string
  base_price: number
  image_url: string | null
}

interface Props {
  products: PublicProduct[]
  storeName: string
  ongkir: number
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export function OrderClient({ products, storeName, ongkir }: Props) {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [nama, setNama] = useState("")
  const [phone, setPhone] = useState("")
  const [alamat, setAlamat] = useState("")
  const [catatan, setCatatan] = useState("")
  const [locationUrl, setLocationUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items: OnlineCartItem[] = products
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ name: p.name, qty: cart[p.id], harga: p.base_price }))

  const submitItems = products
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ productId: p.id, qty: cart[p.id] }))

  const { subtotal, total } = calcOrderTotal(items, ongkir)

  const setQty = (id: string, delta: number) =>
    setCart((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta)
      return { ...prev, [id]: next }
    })

  const captureLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocationUrl(
        `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`,
      )
    })
  }

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const result = await submitOnlineOrder({
        nama,
        phone,
        alamat,
        catatan,
        items: submitItems,
        locationUrl,
      })
      if (result.ok) setDone(true)
      else setError(result.error)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-3 text-xl font-bold text-ink">Pesanan Terkirim!</h1>
        <p className="mt-2 text-ink-soft">
          Terima kasih. Pesanan kamu sudah kami terima dan akan segera diproses.
          Kami akan menghubungi via WhatsApp.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-40">
      <header className="text-center">
        <div className="text-3xl">🍗</div>
        <h1 className="text-xl font-bold text-ink">{storeName}</h1>
        <p className="text-sm text-ink-soft">Pesan online, kami antar/siapkan</p>
      </header>

      <div className="space-y-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-sm"
          >
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🍗</div>
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ink">{p.name}</div>
              <div className="text-sm font-bold text-brand">{rupiah(p.base_price)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty(p.id, -1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline"
                aria-label="Kurangi"
              >
                <Minus size={16} />
              </button>
              <span className="w-5 text-center font-semibold text-ink">
                {cart[p.id] ?? 0}
              </span>
              <button
                onClick={() => setQty(p.id, 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-brand text-white"
                aria-label="Tambah"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="py-8 text-center text-ink-soft">Menu belum tersedia.</p>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border border-hairline bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-ink">Data Pemesan</h2>
        <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama" className="w-full rounded-lg border border-hairline px-3 py-2 text-ink" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nomor WhatsApp" className="w-full rounded-lg border border-hairline px-3 py-2 text-ink" />
        <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Alamat (untuk diantar)" rows={2} className="w-full rounded-lg border border-hairline px-3 py-2 text-ink" />
        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan (opsional)" rows={2} className="w-full rounded-lg border border-hairline px-3 py-2 text-ink" />
        <button onClick={captureLocation} className="flex items-center gap-2 text-sm text-brand">
          <MapPin size={16} /> {locationUrl ? "Lokasi tersimpan ✓" : "Bagikan lokasi GPS"}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-hairline bg-white p-4 shadow-lg">
        <div className="mx-auto max-w-lg">
          <div className="mb-1 flex justify-between text-sm text-ink-soft">
            <span>Subtotal</span>
            <span>{rupiah(subtotal)}</span>
          </div>
          {ongkir > 0 && (
            <div className="mb-1 flex justify-between text-sm text-ink-soft">
              <span>Ongkir</span>
              <span>{rupiah(ongkir)}</span>
            </div>
          )}
          <div className="mb-2 flex justify-between font-bold text-ink">
            <span>Total</span>
            <span>{rupiah(total)}</span>
          </div>
          {error && <p className="mb-2 text-sm text-danger">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-50"
          >
            <ShoppingBag size={18} />
            {submitting ? "Mengirim..." : "Kirim Pesanan"}
          </button>
        </div>
      </div>
    </div>
  )
}
