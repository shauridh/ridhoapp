"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { History, Pencil, ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { voidOrder, editOrder } from "../actions"
import { useToast } from "@/components/ui/toast"
import { useDialog } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/input"

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
  const [editing, setEditing] = useState<Order | null>(null)
  const [editTotal, setEditTotal] = useState("")
  const [editMethod, setEditMethod] = useState<"cash" | "qris">("cash")
  const [editReason, setEditReason] = useState("")
  const [pending, startTransition] = useTransition()
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

  const openEdit = (o: Order) => {
    setEditing(o)
    setEditTotal(String(o.total))
    setEditMethod(o.payment_method as "cash" | "qris")
    setEditReason("")
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    if (!editReason.trim()) {
      toast.show("Alasan wajib diisi", "error")
      return
    }
    const total = Number(editTotal)
    if (Number.isNaN(total) || total < 0) {
      toast.show("Total tidak valid", "error")
      return
    }
    startTransition(async () => {
      const result = await editOrder(
        editing.id,
        { total, paymentMethod: editMethod },
        editReason,
      )
      if (result.ok) {
        toast.show("Transaksi diubah", "success")
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editing.id
              ? { ...o, total, payment_method: editMethod }
              : o,
          ),
        )
        setEditing(null)
      } else {
        toast.show(result.error, "error")
      }
    })
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
      <Link
        href="/pos"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ChevronLeft size={16} /> Kembali ke Kasir
      </Link>
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
        <History size={22} className="text-brand" /> Riwayat Transaksi
      </h1>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
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
              <th className="px-4 py-3 text-right">Aksi</th>
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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="md"
                        icon={Pencil}
                        onClick={() => openEdit(o)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="md"
                        onClick={() => handleVoid(o.id)}
                      >
                        Void
                      </Button>
                    </div>
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

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Transaksi"
        size="md"
      >
        {editing && (
          <form onSubmit={handleEdit} className="space-y-3">
            <p className="text-xs text-ink-soft">
              Edit hanya untuk koreksi total atau metode bayar. Untuk ubah item,
              void transaksi lalu buat baru (agar stok ikut dihitung).
            </p>
            <Input
              label="Total (Rp)"
              type="number"
              min={0}
              value={editTotal}
              onChange={(e) => setEditTotal(e.target.value)}
              money
              required
            />
            <Select
              label="Metode Bayar"
              value={editMethod}
              onChange={(e) => setEditMethod(e.target.value as "cash" | "qris")}
            >
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
            </Select>
            <Input
              label="Alasan perubahan"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="mis. salah input nominal"
              required
            />
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={pending}
                className="flex-1"
              >
                Simpan
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Batal
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
