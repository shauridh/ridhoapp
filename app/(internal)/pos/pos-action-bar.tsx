"use client";

import { Search, Printer } from "lucide-react";

interface Props {
  showSearch: boolean;
  onToggleSearch: () => void;
  showPrint: boolean;
  onTogglePrint: () => void;
}

export function PosActionBar({ showSearch, onToggleSearch, showPrint, onTogglePrint }: Props) {
  return (
    <div className="mb-3 flex items-center justify-end gap-1">
      {/* Toggle Pencarian */}
      <button
        onClick={onToggleSearch}
        title={showSearch ? "Sembunyikan pencarian" : "Tampilkan pencarian"}
        aria-label={showSearch ? "Sembunyikan pencarian" : "Tampilkan pencarian"}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
          showSearch
            ? "border-brand bg-tint-red text-brand"
            : "border-hairline bg-white text-ink-soft hover:bg-surface"
        }`}
      >
        <Search size={15} />
      </button>

      {/* Toggle Print */}
      <button
        onClick={onTogglePrint}
        title={showPrint ? "Nonaktifkan cetak" : "Aktifkan cetak"}
        aria-label={showPrint ? "Nonaktifkan cetak" : "Aktifkan cetak"}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
          showPrint
            ? "border-brand bg-tint-red text-brand"
            : "border-hairline bg-white text-ink-soft hover:bg-surface"
        }`}
      >
        <Printer size={15} />
      </button>
    </div>
  );
}
