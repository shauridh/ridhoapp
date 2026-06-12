"use client"

import { useEffect, useState } from "react"
import { Bookmark, Play, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Cart } from "@/lib/domain/cart"
import { deleteHeldOrder } from "./held-actions"
import { useToast } from "@/components/ui/toast"
import { useDialog } from "@/components/ui/dialog"

interface HeldOrder {
  id: string
  label: string
  cart: Cart
  total: number
  created_at: string
}

interface Props {
  refreshKey: number
  onResume: (cart: Cart) => void
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export function HeldOrders({ refreshKey, onResume }: Props) {
  const [orders, setOrders] = useState<HeldOrder[]>([])
  const [show, setShow] = useState(false)
  const toast = useToast()
  const dialog = useDialog()

  const load = () => {
    const supabase = createClient()
    supabase
      .from("held_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as HeldOrder[]) ?? []))
  }

  useEffect(load, [refreshKey])

  const handleResume = async (o: HeldOrder) => {
    onResume(o.cart)
    await deleteHeldOrder(o.id)
    load()
    toast.show(`Pesanan "${o.label}" dilanjutkan`, "success")
  }

  const handleDelete = async (o: HeldOrder) => {
    const ok = await dialog.confirm(
      `Hapus pesanan tersimpan "${o.label}"?`,
      "Hapus Pesanan",
    )
    if (!ok) return
    const result = await deleteHeldOrder(o.id)
    if (result.ok) {
      load()
      toast.show("Pesanan dihapus", "success")
    } else {
      toast.show(result.error, "error")
    }
  }

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 text-sm font-semibold text-ink"
      >
        <Bookmark size={16} className="text-brand" />
        Pesanan Tersimpan
        {orders.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {orders.length}
          </span>
        )}
      </button>

      {show && (
        <div className="mt-2 max-h-60 space-y-2 overflow-y-auto">
          {orders.length === 0 && (
            <p className="py-2 text-center text-sm text-ink-soft">
              Belum ada pesanan tersimpan.
            </p>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-hairline bg-white p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{o.label}</span>
                <span className="font-semibold text-brand">
                  {rupiah(o.total)}
                </span>
              </div>
              <div className="text-xs text-ink-soft">
                {o.cart.length} item ·{" "}
                {new Date(o.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleResume(o)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand px-2 py-1.5 text-xs font-semibold text-white"
                >
                  <Play size={14} /> Lanjutkan
                </button>
                <button
                  onClick={() => handleDelete(o)}
                  className="flex items-center justify-center rounded-lg border border-hairline px-2 py-1.5 text-danger"
                  aria-label="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
