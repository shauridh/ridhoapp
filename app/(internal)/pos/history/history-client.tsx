"use client"

import { useEffect, useState } from "react"
import { History } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { voidOrder } from "../actions"
import { useToast } from "@/components/ui/toast"
import { useDialog } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
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

type Filter = "all" | "completed" | "voided"

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export function HistoryClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [loaded, setLoaded] = useState(false)
  const toast = useToast()
  const dialog = useDialog()

  const load = () => {
    const supabase = createClient()
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setOrders((data as Order[]) ?? [])
        setLoaded(true)
      })
  }

  useEffect(load, [])

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

  const visible = orders.filter((o) =>
    filter === "all" ? true : o.status === filter,
  )

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "completed", label: "Selesai" },
    { key: "voided", label: "Dibatalkan" },
  ]

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
        <History size={22} className="text-brand" /> Riwayat Transaksi
      </h1>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? "bg-brand text-white"
                : "bg-white text-ink-soft hover:bg-surface"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left text-ink-soft">
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Bayar</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr
                key={o.id}
                className="border-b border-hairline last:border-0 text-ink transition hover:bg-surface/50"
              >
                <td className="px-4 py-3">
                  {new Date(o.created_at).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {rupiah(o.total)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={o.payment_method === "cash" ? "success" : "accent"}>
                    {o.payment_method.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {o.status === "completed" ? (
                    <Badge tone="success">Selesai</Badge>
                  ) : (
                    <Badge tone="danger">Dibatalkan</Badge>
                  )}
                  {o.void_reason && (
                    <span className="ml-1 text-xs text-ink-soft">
                      ({o.void_reason})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {o.status === "completed" && (
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => handleVoid(o.id)}
                    >
                      Void
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {loaded && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
