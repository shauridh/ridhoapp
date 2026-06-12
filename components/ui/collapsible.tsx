"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

interface Props {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

// Panel yang bisa dibuka-tutup untuk menyembunyikan form sampai dibutuhkan.
export function Collapsible({
  title,
  icon,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface/60"
      >
        <span className="flex items-center gap-2 font-semibold text-ink">
          {icon && <span className="text-brand">{icon}</span>}
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-hairline p-4">{children}</div>}
    </div>
  )
}
