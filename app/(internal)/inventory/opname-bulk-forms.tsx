"use client"

import { useState, useTransition } from "react"
import { ClipboardCheck, Upload } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { stockOpname, bulkImportIngredients } from "./actions"

interface Option {
  id: string
  name: string
  unit: string
}

export function OpnameBulkForms({ ingredients }: { ingredients: Option[] }) {
  const [pending, startTransition] = useTransition()
  const [bulkText, setBulkText] = useState("")
  const toast = useToast()

  const handleOpname = (formData: FormData) => {
    startTransition(async () => {
      const result = await stockOpname(formData)
      if (result.ok) toast.show("Opname tersimpan", "success")
      else toast.show(result.error, "error")
    })
  }

  const handleBulk = () => {
    startTransition(async () => {
      const result = await bulkImportIngredients(bulkText)
      if (result.ok) {
        toast.show(`${result.count} bahan ditambahkan`, "success")
        setBulkText("")
      } else {
        toast.show(result.error, "error")
      }
    })
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card>
        <h3 className="mb-2 flex items-center gap-2 font-medium text-ink">
          <ClipboardCheck size={18} className="text-brand" /> Stok Opname
        </h3>
        <form action={handleOpname} className="space-y-2">
          <Select name="ingredientId" required label="Bahan">
            <option value="">Pilih bahan...</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit})
              </option>
            ))}
          </Select>
          <Input
            name="physicalQty"
            type="number"
            step="0.0001"
            label="Jumlah fisik (hasil hitung)"
            placeholder="0"
          />
          <Button type="submit" loading={pending} icon={ClipboardCheck}>
            Simpan Opname
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-2 flex items-center gap-2 font-medium text-ink">
          <Upload size={18} className="text-brand" /> Bulk Import Bahan
        </h3>
        <p className="mb-2 text-xs text-ink-soft">
          Format per baris: nama,satuan,satuan_beli,isi,batas_menipis
          <br />
          Contoh: Ayam,potong,kantung,9,18
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          placeholder="Ayam,potong,kantung,9,18"
        />
        <Button
          onClick={handleBulk}
          loading={pending}
          icon={Upload}
          className="mt-2"
        >
          Import
        </Button>
      </Card>
    </div>
  )
}
