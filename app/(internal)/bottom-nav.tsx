"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Package,
  UtensilsCrossed,
  Wallet,
  LayoutDashboard,
  MoreHorizontal,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { logout } from "@/lib/domain/auth";

const links = [
  { href: "/pos", label: "Kasir", icon: ShoppingCart },
  { href: "/inventory", label: "Stok", icon: Package },
  { href: "/settings/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/finance", label: "Keuangan", icon: Wallet },
];

const moreLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline bg-white md:hidden">
        {links.map((l) => {
          const active = isActive(pathname, l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-2xs font-medium ${
                active ? "text-brand" : "text-ink-soft"
              }`}
            >
              <Icon size={20} />
              {l.label}
            </Link>
          );
        })}
        <button
          onClick={() => setShowMore(true)}
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-2xs font-medium ${
            moreLinks.some((m) => isActive(pathname, m.href)) ? "text-brand" : "text-ink-soft"
          }`}
        >
          <MoreHorizontal size={20} />
          Lainnya
        </button>
      </nav>

      {showMore && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 md:hidden"
          onClick={() => setShowMore(false)}
        >
          <div className="w-full rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-ink">Lainnya</h2>
              <button
                onClick={() => setShowMore(false)}
                aria-label="Tutup"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-1">
              {moreLinks.map((l) => {
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setShowMore(false)}
                    className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2 font-medium text-ink hover:bg-surface"
                  >
                    <Icon size={20} className="text-brand" />
                    {l.label}
                  </Link>
                );
              })}
              <form action={logout}>
                <button className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-2 font-medium text-danger hover:bg-tint-red">
                  <LogOut size={20} />
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
