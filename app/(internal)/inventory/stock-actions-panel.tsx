"use client"

import { useState } from "react"
import { Plus, PackagePlus, ClipboardCheck } from "lucide-react"
import { SlideOver } from "@/components/ui/slide-over"
import { IngredientForm } from "./ingredient-form"
import { StockActionsForm } from "./stock-actions-form"
import { OpnameBulkForms } from "./opname-bulk-forms"

interface Option {
  id: string
  name: string
  unit: string
}

type Tab = "add" | "restock" | "opname"

const TABS: { key: Tab; label: string }[] = [
  { key: "add", label: "Tambah Bahan" },
  { key: "restock", label: "Restock" },
  { key: "opname", label: "Opname & Import" },
]

// Tombol "Aksi Stok" yang membuka panel bertab berisi semua form.
export function StockActionsPanel({ ingredients }: { ingredients: Option[] }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("add")

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark active:scale-95"
      >
        <PackagePlus size={18} /> Aksi Stok
      </button>

      {open && (
        <SlideOver title="Aksi Stok" icon={PackagePlus} onClose={() => setOpen(false)}>
          <div className="mb-4 flex gap-2 border-b border-hairline">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                  tab === t.key
                    ? "border-brand text-brand"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "add" && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
                <Plus size={16} className="text-brand" /> Tambah Bahan Baru
              </h3>
              <IngredientForm />
            </div>
          )}
          {tab === "restock" && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
                <PackagePlus size={16} className="text-brand" /> Restock & Penyesuaian
              </h3>
              <StockActionsForm ingredients={ingredients} />
            </div>
          )}
          {tab === "opname" && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
                <ClipboardCheck size={16} className="text-brand" /> Opname & Import Massal
              </h3>
              <OpnameBulkForms ingredients={ingredients} />
            </div>
          )}
        </SlideOver>
      )}
    </>
  )
}
