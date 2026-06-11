"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { voidOrder } from "./actions"
import { useToast } from "@/components/ui/toast"
import { useDialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  total: number
  payment_method: string
  status: string
  void_reason: string | null
  created_at: string
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [show, setShow] = useState(false)
  const toast = useToast()
  const dialog = useDialog()

  useEffect(() => {
    if (!show) return
    const supabase = createClient()
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setOrders(data ?? []))
  }, [show])

  const handleVoid = async (id: string) => {
    const reason = await dialog.prompt("Masukkan alasan void:", "Void Transaksi")
    if (!reason) return
    const result = await voidOrder(id, reason)
    if (result.ok) {
      toast.show("Transaksi dibatalkan", "success")
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: "voided", void_reason: reason } : o,
        ),
      )
    } else {
      toast.show(result.error, "error")
    }
  }

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        className="text-sm text-ink-soft underline"
      >
        {show ? "Sembunyikan Riwayat" : "Riwayat Transaksi"}
      </button>
      {show && (
        <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
          {orders.length === 0 && (
            <p className="py-2 text-center text-sm text-ink-soft">Belum ada.</p>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border border-hairline bg-white px-3 py-2 text-sm"
            >
              <div>
                <div className="font-semibold text-ink">
                  Rp {o.total.toLocaleString("id-ID")}{" "}
                  <Badge tone={o.payment_method === "cash" ? "success" : "accent"}>
                    {o.payment_method.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-ink-soft">
                  {new Date(o.created_at).toLocaleString("id-ID")}
                </div>
              </div>
              {o.status === "completed" ? (
                <Button variant="danger" size="md" onClick={() => handleVoid(o.id)}>
                  Void
                </Button>
              ) : (
                <Badge tone="danger">Dibatalkan</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
