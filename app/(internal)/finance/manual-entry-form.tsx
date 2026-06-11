"use client"

import { useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
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
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="font-semibold text-ink">Input Manual</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={direction === "in" ? "success" : "ghost"}
            onClick={() => setDirection("in")}
            className="flex-1"
          >
            Masuk
          </Button>
          <Button
            type="button"
            variant={direction === "out" ? "danger" : "ghost"}
            onClick={() => setDirection("out")}
            className="flex-1"
          >
            Keluar
          </Button>
        </div>
        {direction === "out" && (
          <Select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="opex">Pengeluaran Operasional (OpEx)</option>
            <option value="capex">Belanja Modal (CapEx)</option>
            <option value="withdrawal">Tarik Dana Owner</option>
          </Select>
        )}
        <Input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
        />
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Jumlah (Rp)"
          required
        />
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan"
        />
        <Button type="submit" variant="primary" loading={pending} className="w-full">
          Simpan
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </form>
    </Card>
  )
}
