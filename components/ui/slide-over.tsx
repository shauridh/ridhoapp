"use client"

import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Props {
  title: string
  icon?: LucideIcon
  onClose: () => void
  children: ReactNode
  widthClass?: string
}

// Panel geser dari kanan untuk konten sekunder (tersimpan, online, aksi stok, dll).
export function SlideOver({
  title,
  icon: Icon,
  onClose,
  children,
  widthClass = "max-w-md",
}: Props) {
  // Tutup dengan tombol Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className={`flex w-full ${widthClass} flex-col overflow-y-auto bg-surface shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-white px-4 py-3">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            {Icon && <Icon size={18} className="text-brand" />}
            {title}
          </h2>
          <button onClick={onClose} aria-label="Tutup panel">
            <X size={20} className="text-ink-soft" />
          </button>
        </div>
        <div className="flex-1 p-4">{children}</div>
      </div>
    </div>
  )
}
