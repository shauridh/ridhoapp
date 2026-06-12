"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
import { createManualEntry } from "./actions"

interface Category {
  id: string
  name: string
  kind: string
}

export function ManualEntryForm({ categories: _categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [direction, setDirection] = useState<"in" | "out">("out")
  const [amount, setAmount] = useState("")
  const [kind, setKind] = useState<"opex" | "capex" | "capital" | "withdrawal">("opex")
  const [note, setNote] = useState("")
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const close = () => {
    setOpen(false)
    setError(null)
    setAmount("")
    setNote("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createManualEntry({
        direction,
        amount: Number(amount),
        kind: direction === "in" ? "capital" : kind,
        categoryId: null,
        note,
        entryDate,
      })
      if (result.ok) close()
      else setError(result.error)
    })
  }

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        Input Manual
      </Button>

      <Modal open={open} onClose={close} title="Input Arus Kas Manual" size="md">
        <form onSubmit={handleSubmit} className="space-y-3">
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
              label="Jenis pengeluaran"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="opex">Operasional (OpEx)</option>
              <option value="capex">Belanja Modal (CapEx)</option>
              <option value="withdrawal">Tarik Dana Owner</option>
            </Select>
          )}
          <Input
            type="date"
            label="Tanggal"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
          <Input
            type="number"
            label="Jumlah (Rp)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            money
            required
          />
          <Input
            label="Catatan"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. beli gas, bayar listrik"
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
            <Button type="button" variant="ghost" onClick={close}>
              Batal
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </Modal>
    </>
  )
}
