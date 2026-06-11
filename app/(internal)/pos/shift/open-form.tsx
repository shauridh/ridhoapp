"use client"

import { useState, useTransition } from "react"
import { openShift } from "./actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="font-semibold text-ink">Buka Shift</h3>
        <Input
          type="number"
          label="Saldo Awal (modal kembalian)"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
        <Button type="submit" variant="primary" loading={pending} className="w-full">
          Buka Shift
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </form>
    </Card>
  )
}
