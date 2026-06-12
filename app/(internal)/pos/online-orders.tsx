"use client"

import { Check, X, MapPin, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { OnlineOrder } from "./use-online-orders"

interface Props {
  orders: OnlineOrder[]
  onConfirm: (id: string) => void
  onMarkPaid: (id: string) => void
  onMarkDone: (id: string) => void
  onCancel: (id: string) => void
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

const statusTone: Record<string, "neutral" | "accent" | "success" | "danger"> = {
  pending: "accent",
  confirmed: "neutral",
  paid: "success",
}

const waLink = (o: OnlineOrder) => {
  const lines = o.items.map((i) => `- ${i.name} x${i.qty}`).join("\n")
  const msg = `Halo ${o.nama}, pesanan kamu:\n${lines}\nTotal: ${rupiah(o.total)}\nTerima kasih sudah memesan di Sabana Fried Chicken!`
  const phone = o.phone.replace(/^0/, "62").replace(/\D/g, "")
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

// Konten daftar pesanan online (dipakai di dalam SlideOver).
export function OnlineOrders({
  orders,
  onConfirm,
  onMarkPaid,
  onMarkDone,
  onCancel,
}: Props) {
  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-soft">
        Belum ada pesanan online.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div
          key={o.id}
          className="rounded-xl border border-hairline bg-white p-3 text-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink">{o.nama}</span>
            <Badge tone={statusTone[o.status] ?? "neutral"}>{o.status}</Badge>
          </div>
          <div className="text-xs text-ink-soft">{o.phone}</div>
          {o.alamat && <div className="text-xs text-ink-soft">{o.alamat}</div>}
          <ul className="my-1 text-xs text-ink">
            {o.items.map((i, idx) => (
              <li key={idx}>
                {i.name} x{i.qty}
              </li>
            ))}
          </ul>
          <div className="font-semibold text-brand">{rupiah(o.total)}</div>

          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={waLink(o)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-success px-2 py-1 text-xs font-semibold text-white"
            >
              <MessageCircle size={14} /> WA
            </a>
            {o.location_url && (
              <a
                href={o.location_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-xs text-ink"
              >
                <MapPin size={14} /> Lokasi
              </a>
            )}
            {o.status === "pending" && (
              <button
                onClick={() => onConfirm(o.id)}
                className="rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-white"
              >
                Konfirmasi
              </button>
            )}
            {o.status === "confirmed" && (
              <button
                onClick={() => onMarkPaid(o.id)}
                className="rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-ink"
              >
                Sudah Bayar
              </button>
            )}
            {o.status === "paid" && (
              <button
                onClick={() => onMarkDone(o.id)}
                className="flex items-center gap-1 rounded-lg bg-success px-2 py-1 text-xs font-semibold text-white"
              >
                <Check size={14} /> Selesai
              </button>
            )}
            <button
              onClick={() => onCancel(o.id)}
              className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-xs text-danger"
            >
              <X size={14} /> Batal
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
