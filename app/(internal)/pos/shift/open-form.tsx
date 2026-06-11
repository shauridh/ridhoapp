"use client"

import { useState, useTransition } from "react"
import { openShift } from "./actions"

export function OpenForm() {
  const [balance, setBalance] = useState("50000")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await openShift(Number(balance))
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Buka Shift</h3>
      <div>
        <label className="text-sm text-gray-600">
          Saldo Awal (modal kembalian)
        </label>
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-black py-2 text-white disabled:opacity-50"
      >
        {pending ? "Membuka..." : "Buka Shift"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
