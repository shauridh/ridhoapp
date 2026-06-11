"use client"

import { useEffect, useState } from "react"
import { Bell, Check, X, MapPin, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import {
  confirmOnlineOrder,
  markOnlinePaid,
  markOnlineDone,
  cancelOnlineOrder,
} from "./online-actions"

interface OnlineOrder {
  id: string
  nama: string
  phone: string
  alamat: string | null
  items: { name: string; qty: number; harga: number }[]
  catatan: string | null
  total: number
  status: string
  location_url: string | null
  created_at: string
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

const statusTone: Record<string, "neutral" | "accent" | "success" | "danger"> = {
  pending: "accent",
  confirmed: "neutral",
  paid: "success",
}

export function OnlineOrders() {
  const [orders, setOrders] = useState<OnlineOrder[]>([])
  const [show, setShow] = useState(false)
  const toast = useToast()

  const load = () => {
    const supabase = createClient()
    supabase
      .from("online_orders")
      .select("*")
      .in("status", ["pending", "confirmed", "paid"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []))
  }

  useEffect(() => {
    load()
    const supabase = createClient()
    // Realtime: muat ulang saat ada perubahan pesanan online.
    const channel = supabase
      .channel("online_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "online_orders" },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const act = async (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    okMsg: string,
  ) => {
    const result = await fn()
    if (result.ok) {
      toast.show(okMsg, "success")
      load()
    } else {
      toast.show(result.error ?? "Gagal", "error")
    }
  }

  const waLink = (o: OnlineOrder) => {
    const lines = o.items.map((i) => `- ${i.name} x${i.qty}`).join("\n")
    const msg = `Halo ${o.nama}, pesanan kamu:\n${lines}\nTotal: ${rupiah(o.total)}\nTerima kasih sudah memesan di Sabana Fried Chicken!`
    const phone = o.phone.replace(/^0/, "62").replace(/\D/g, "")
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  const pendingCount = orders.filter((o) => o.status === "pending").length

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 text-sm font-semibold text-ink"
      >
        <Bell size={16} className="text-brand" />
        Order Online
        {pendingCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {pendingCount}
          </span>
        )}
      </button>

      {show && (
        <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
          {orders.length === 0 && (
            <p className="py-2 text-center text-sm text-ink-soft">
              Belum ada pesanan online.
            </p>
          )}
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
              {o.alamat && (
                <div className="text-xs text-ink-soft">{o.alamat}</div>
              )}
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
                    onClick={() => act(() => confirmOnlineOrder(o.id), "Dikonfirmasi")}
                    className="rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-white"
                  >
                    Konfirmasi
                  </button>
                )}
                {o.status === "confirmed" && (
                  <button
                    onClick={() => act(() => markOnlinePaid(o.id), "Ditandai lunas")}
                    className="rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-ink"
                  >
                    Sudah Bayar
                  </button>
                )}
                {o.status === "paid" && (
                  <button
                    onClick={() => act(() => markOnlineDone(o.id), "Selesai")}
                    className="flex items-center gap-1 rounded-lg bg-success px-2 py-1 text-xs font-semibold text-white"
                  >
                    <Check size={14} /> Selesai
                  </button>
                )}
                <button
                  onClick={() => act(() => cancelOnlineOrder(o.id), "Dibatalkan")}
                  className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-xs text-danger"
                >
                  <X size={14} /> Batal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
