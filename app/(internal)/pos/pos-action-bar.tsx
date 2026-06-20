"use client";

import Link from "next/link";
import { Bookmark, Bell, Receipt, History, Search, Printer } from "lucide-react";

interface Props {
  heldCount: number;
  onlinePendingCount: number;
  panel: string | null;
  onOpenPanel: (panel: "held" | "online" | "shift") => void;
  showSearch: boolean;
  onToggleSearch: () => void;
  showPrint: boolean;
  onTogglePrint: () => void;
}

export function PosActionBar({
  heldCount,
  onlinePendingCount,
  panel,
  onOpenPanel,
  showSearch,
  onToggleSearch,
  showPrint,
  onTogglePrint,
}: Props) {
  return (
    <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-0.5">
      {/* Pesanan Tersimpan */}
      <ActionBtn
        label="Tersimpan"
        icon={Bookmark}
        badge={heldCount > 0 ? heldCount : undefined}
        badgeColor="bg-amber-500"
        active={panel === "held"}
        onClick={() => onOpenPanel("held")}
      />

      {/* Pesanan Online */}
      <ActionBtn
        label="Online"
        icon={Bell}
        badge={onlinePendingCount > 0 ? onlinePendingCount : undefined}
        badgeColor="bg-danger"
        active={panel === "online"}
        onClick={() => onOpenPanel("online")}
      />

      {/* Kelola Shift */}
      <ActionBtn
        label="Shift"
        icon={Receipt}
        active={panel === "shift"}
        onClick={() => onOpenPanel("shift")}
      />

      {/* Riwayat — navigasi ke halaman terpisah */}
      <Link
        href="/pos/history"
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm transition hover:bg-surface active:scale-95"
      >
        <History size={14} />
        Riwayat
      </Link>

      <div className="ml-auto flex shrink-0 items-center gap-1">
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
    </div>
  );
}

function ActionBtn({
  label,
  icon: Icon,
  badge,
  badgeColor = "bg-brand",
  active,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm transition active:scale-95 ${
        active
          ? "border-brand bg-tint-red text-brand"
          : "border-hairline bg-white text-ink-soft hover:bg-surface"
      }`}
    >
      <Icon size={14} />
      {label}
      {badge !== undefined && (
        <span
          className={`ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
            badgeColor
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
