"use client"

import { useState } from "react"
import { PackagePlus, ClipboardCheck } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { StockActionsForm } from "./stock-actions-form"
import { OpnameBulkForms } from "./opname-bulk-forms"

interface Option {
  id: string
  name: string
  unit: string
}

type Tab = "restock" | "opname"

const TABS: { key: Tab; label: string }[] = [
  { key: "restock", label: "Restock & Penyesuaian" },
  { key: "opname", label: "Opname & Import" },
]

// Tombol "Aksi Stok" yang membuka modal popup bertab.
export function StockActionsPanel({ ingredients }: { ingredients: Option[] }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("restock")

  return (
    <>
      <Button
        variant="secondary"
        icon={PackagePlus}
        onClick={() => setOpen(true)}
      >
        Aksi Stok
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Aksi Stok" size="lg">
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

        {tab === "restock" && <StockActionsForm ingredients={ingredients} />}
        {tab === "opname" && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
              <ClipboardCheck size={16} className="text-brand" /> Opname & Import Massal
            </h3>
            <OpnameBulkForms ingredients={ingredients} />
          </div>
        )}
      </Modal>
    </>
  )
}
