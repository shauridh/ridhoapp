"use client"

import { useState, useTransition } from "react"
import { createManualEntry } from "./actions"

interface Category {
  id: string
  name: string
  kind: string
}

export function ManualEntryForm({ categories }: { categories: Category[] }) {
  const [direction, setDirection] = useState<"in" | "out">("out")
  const [amount, setAmount] = useState("")
  const [kind, setKind] = useState<"opex" | "capex" | "capital" | "withdrawal">("opex")
  const [categoryId, setCategoryId] = useState("")
  const [note, setNote] = useState("")
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const relevantCategories = categories.filter(
    (c) => c.kind === kind || (direction === "in" && c.kind === "capital"),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createManualEntry({
        direction,
        amount: Number(amount),
        kind: direction === "in" ? "capital" : kind,
        categoryId: categoryId || null,
        note,
        entryDate,
      })
      if (!result.ok) setError(result.error)
      if (result.ok) {
        setAmount("")
        setNote("")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Input Manual</h3>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDirection("in")}
          className={`flex-1 rounded-lg py-2 ${
            direction === "in" ? "bg-green-600 text-white" : "border"
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => setDirection("out")}
          className={`flex-1 rounded-lg py-2 ${
            direction === "out" ? "bg-red-600 text-white" : "border"
          }`}
        >
          Keluar
        </button>
      </div>
      {direction === "out" && (
        <select
          value={kind}
          onChange={(e) =>
            setKind(e.target.value as typeof kind)
          }
          className="w-full rounded border px-3 py-2"
        >
          <option value="opex">Pengeluaran Operasional (OpEx)</option>
          <option value="capex">Belanja Modal (CapEx)</option>
          <option value="withdrawal">Tarik Dana Owner</option>
        </select>
      )}
      <input
        type="date"
        value={entryDate}
        onChange={(e) => setEntryDate(e.target.value)}
        className="w-full rounded border px-3 py-2"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Jumlah (Rp)"
        required
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan"
        className="w-full rounded border px-3 py-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-black py-2 text-white disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
