"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { addIngredient } from "./actions"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
import { USAGE_UNITS, PURCHASE_UNITS } from "@/lib/domain/units"

export function IngredientForm() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const close = () => {
    setOpen(false)
    setError(null)
  }

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        Tambah Bahan
      </Button>

      <Modal open={open} onClose={close} title="Bahan Baru" size="md">
        <form
          action={(formData) => {
            setError(null)
            startTransition(async () => {
              const result = await addIngredient(formData)
              if (result.ok) close()
              else setError(result.error)
            })
          }}
          className="space-y-4"
        >
          <Input name="name" label="Nama bahan" required />

          <div className="grid gap-3 sm:grid-cols-2">
            <Select name="unit" label="Satuan pakai" required>
              {USAGE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
            <Select name="trackingType" label="Tipe">
              <option value="ingredient">Bahan baku</option>
              <option value="finished">Produk jadi</option>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select name="purchaseUnit" label="Satuan beli">
              <option value="">—</option>
              {PURCHASE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
            <Input
              name="purchaseUnitQty"
              label="Isi per satuan beli"
              type="number"
              step="0.0001"
              defaultValue={1}
            />
          </div>

          <Input
            name="lowStockThreshold"
            label="Batas menipis (peringatan)"
            type="number"
            step="0.0001"
            defaultValue={0}
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={pending}
              className="flex-1"
            >
              {pending ? "Menyimpan..." : "Simpan"}
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
