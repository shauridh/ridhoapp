"use client";

import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useOverlayA11y } from "./use-overlay-a11y";

interface Props {
  title: string;
  icon?: LucideIcon;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}

// Panel geser dari kanan untuk konten sekunder (tersimpan, online, aksi stok, dll).
export function SlideOver({
  title,
  icon: Icon,
  onClose,
  children,
  widthClass = "max-w-md",
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayA11y(true, onClose, panelRef);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`flex w-full ${widthClass} flex-col overflow-y-auto bg-surface shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-white px-4 py-3">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            {Icon && <Icon size={18} className="text-brand" />}
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup panel"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}
