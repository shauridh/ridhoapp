"use client"

import { type ReactNode, useRef } from "react"
import { X } from "lucide-react"
import { useOverlayA11y } from "./use-overlay-a11y"

type Size = "sm" | "md" | "lg"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: Size
  children: ReactNode
  footer?: ReactNode
}

const sizeClass: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
}

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
  footer,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useOverlayA11y(open, onClose, panelRef)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full ${sizeClass[size]} flex-col overflow-hidden rounded-2xl bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="border-t border-hairline px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  )
}
