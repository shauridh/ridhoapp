"use client"

import { useState, useTransition } from "react"
import { cashOut, closeShift } from "./actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  shift: { id: string; expected_cash: number }
}

export function CloseForm({ shift }: Props) {
  const [counted, setCounted] = useState("")
  const [withdrawal, setWithdrawal] = useState("0")
  const [cashOutAmount, setCashOutAmount] = useState("")
  const [cashOutReason, setCashOutReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await closeShift({
        shiftId: shift.id,
        countedCash: Number(counted),
        ownerWithdrawal: Number(withdrawal),
      })
      if (!result.ok) setError(result.error)
    })
  }

  const handleCashOut = () => {
    setError(null)
    startTransition(async () => {
      const result = await cashOut(
        shift.id,
        Number(cashOutAmount),
        cashOutReason,
      )
      if (!result.ok) setError(result.error)
      if (result.ok) {
        setCashOutAmount("")
        setCashOutReason("")
      }
    })
  }

  const diff = counted ? Number(counted) - shift.expected_cash : null

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-2">
          <h3 className="font-semibold text-ink">Cash Out Drawer</h3>
          <Input
            type="number"
            value={cashOutAmount}
            onChange={(e) => setCashOutAmount(e.target.value)}
            placeholder="Nominal"
          />
          <Input
            value={cashOutReason}
            onChange={(e) => setCashOutReason(e.target.value)}
            placeholder="Alasan (mis. beli gas/es batu)"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleCashOut}
            loading={pending}
          >
            Catat Cash Out
          </Button>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleClose} className="space-y-3">
          <h3 className="font-semibold text-ink">Tutup Shift</h3>
          <div className="text-sm text-ink-soft">
            Expected: Rp {shift.expected_cash.toLocaleString("id-ID")}
          </div>
          <Input
            type="number"
            label="Uang Dihitung (fisik)"
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
            required
          />
          {diff !== null && (
            <div className={`text-sm ${diff >= 0 ? "text-success" : "text-danger"}`}>
              Selisih: Rp {Math.abs(diff).toLocaleString("id-ID")} {diff >= 0 ? "(lebih)" : "(kurang)"}
            </div>
          )}
          <Input
            type="number"
            label="Uang Diambil Owner"
            value={withdrawal}
            onChange={(e) => setWithdrawal(e.target.value)}
          />
          <Button type="submit" variant="primary" loading={pending} className="w-full">
            Tutup Shift
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </Card>
    </div>
  )
}
