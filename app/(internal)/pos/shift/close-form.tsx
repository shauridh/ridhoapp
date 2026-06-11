"use client"

import { useState, useTransition } from "react"
import { cashOut, closeShift } from "./actions"

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
      <div className="space-y-2 rounded-lg border p-4">
        <h3 className="font-semibold">Cash Out Drawer</h3>
        <input
          type="number"
          value={cashOutAmount}
          onChange={(e) => setCashOutAmount(e.target.value)}
          placeholder="Nominal"
          className="w-full rounded border px-3 py-2"
        />
        <input
          value={cashOutReason}
          onChange={(e) => setCashOutReason(e.target.value)}
          placeholder="Alasan (mis. beli gas/es batu)"
          className="w-full rounded border px-3 py-2"
        />
        <button
          type="button"
          onClick={handleCashOut}
          disabled={pending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
        >
          Catat Cash Out
        </button>
      </div>

      <form onSubmit={handleClose} className="space-y-3 rounded-lg border p-4">
        <h3 className="font-semibold">Tutup Shift</h3>
        <div className="text-sm text-gray-600">
          Expected: Rp {shift.expected_cash.toLocaleString("id-ID")}
        </div>
        <div>
          <label className="text-sm text-gray-600">Uang Dihitung (fisik)</label>
          <input
            type="number"
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
        {diff !== null && (
          <div className={`text-sm ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
            Selisih: Rp {Math.abs(diff).toLocaleString("id-ID")} {diff >= 0 ? "(lebih)" : "(kurang)"}
          </div>
        )}
        <div>
          <label className="text-sm text-gray-600">Uang Diambil Owner</label>
          <input
            type="number"
            value={withdrawal}
            onChange={(e) => setWithdrawal(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-black py-2 text-white disabled:opacity-50"
        >
          {pending ? "Menutup..." : "Tutup Shift"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  )
}
