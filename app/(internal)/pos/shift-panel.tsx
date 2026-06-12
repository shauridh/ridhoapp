"use client"

import { useEffect, useState, useTransition } from "react"
import { X, Receipt, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cashOut, closeShift } from "./shift/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"

interface Props {
  shiftId: string
  openingBalance: number
  onClose: () => void
}

interface Movement {
  id: string
  amount: number
  reason: string | null
  created_at: string
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`

export function ShiftPanel({ shiftId, openingBalance, onClose }: Props) {
  const [cashSales, setCashSales] = useState(0)
  const [qrisTotal, setQrisTotal] = useState(0)
  const [movements, setMovements] = useState<Movement[]>([])
  const [coAmount, setCoAmount] = useState("")
  const [coReason, setCoReason] = useState("")
  const [counted, setCounted] = useState("")
  const [withdrawal, setWithdrawal] = useState("0")
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const load = () => {
    const supabase = createClient()
    supabase
      .from("orders")
      .select("total, payment_method")
      .eq("shift_id", shiftId)
      .eq("status", "completed")
      .then(({ data }) => {
        let cash = 0
        let qris = 0
        for (const o of data ?? []) {
          if (o.payment_method === "cash") cash += Number(o.total)
          if (o.payment_method === "qris") qris += Number(o.total)
        }
        setCashSales(cash)
        setQrisTotal(qris)
      })
    supabase
      .from("cash_drawer_movements")
      .select("id, amount, reason, created_at")
      .eq("shift_id", shiftId)
      .eq("direction", "out")
      .order("created_at", { ascending: false })
      .then(({ data }) =>
        setMovements(
          (data ?? []).map((m) => ({
            id: m.id,
            amount: Number(m.amount),
            reason: m.reason,
            created_at: m.created_at,
          })),
        ),
      )
  }

  useEffect(load, [shiftId])

  const cashOutTotal = movements.reduce((s, m) => s + m.amount, 0)
  const expected = openingBalance + cashSales - cashOutTotal
  const diff = counted ? Number(counted) - expected : null

  const handleCashOut = () => {
    if (!coAmount || Number(coAmount) <= 0) {
      toast.show("Nominal harus lebih dari 0", "error")
      return
    }
    startTransition(async () => {
      const result = await cashOut(shiftId, Number(coAmount), coReason)
      if (result.ok) {
        toast.show("Cash out dicatat", "success")
        setCoAmount("")
        setCoReason("")
        load()
      } else {
        toast.show(result.error, "error")
      }
    })
  }

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await closeShift({
        shiftId,
        countedCash: Number(counted),
        ownerWithdrawal: Number(withdrawal),
      })
      if (result.ok) {
        toast.show("Shift ditutup", "success")
        onClose()
      } else {
        toast.show(result.error, "error")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex w-full max-w-md flex-col overflow-y-auto bg-surface shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-hairline bg-white px-4 py-3">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <Receipt size={18} className="text-brand" /> Kelola Shift
          </h2>
          <button onClick={onClose} aria-label="Tutup panel">
            <X size={20} className="text-ink-soft" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-ink">Ringkasan Kas</h3>
            <dl className="space-y-1 text-sm">
              <Row label="Saldo Awal" value={rupiah(openingBalance)} />
              <Row label="Tunai Masuk" value={rupiah(cashSales)} />
              <Row label="QRIS" value={rupiah(qrisTotal)} />
              <Row label="Kas Keluar" value={`- ${rupiah(cashOutTotal)}`} />
              <div className="mt-1 border-t border-hairline pt-1">
                <Row
                  label="Kas Seharusnya"
                  value={rupiah(expected)}
                  bold
                />
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-ink">
              Pengeluaran Drawer
            </h3>
            {movements.length === 0 ? (
              <p className="text-sm text-ink-soft">Belum ada pengeluaran.</p>
            ) : (
              <ul className="mb-3 space-y-1">
                {movements.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="text-ink">{m.reason || "Tanpa alasan"}</div>
                      <div className="text-xs text-ink-soft">
                        {new Date(m.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span className="font-semibold text-danger">
                      - {rupiah(m.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-2">
              <Input
                type="number"
                value={coAmount}
                onChange={(e) => setCoAmount(e.target.value)}
                placeholder="Nominal"
                inputMode="numeric"
              />
              <Input
                value={coReason}
                onChange={(e) => setCoReason(e.target.value)}
                placeholder="Alasan (mis. beli gas/es batu)"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleCashOut}
                loading={pending}
                className="w-full"
              >
                Catat Cash Out
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <form onSubmit={handleClose} className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <LogOut size={16} /> Tutup Shift
              </h3>
              <Input
                type="number"
                label="Uang Dihitung (fisik)"
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
                inputMode="numeric"
                required
              />
              {diff !== null && (
                <div
                  className={`text-sm ${diff >= 0 ? "text-success" : "text-danger"}`}
                >
                  Selisih: {rupiah(Math.abs(diff))}{" "}
                  {diff >= 0 ? "(lebih)" : "(kurang)"}
                </div>
              )}
              <Input
                type="number"
                label="Uang Diambil Owner"
                value={withdrawal}
                onChange={(e) => setWithdrawal(e.target.value)}
                inputMode="numeric"
              />
              <Button
                type="submit"
                variant="primary"
                loading={pending}
                className="w-full"
              >
                Tutup Shift
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={bold ? "font-bold text-brand" : "text-ink"}>{value}</dd>
    </div>
  )
}
