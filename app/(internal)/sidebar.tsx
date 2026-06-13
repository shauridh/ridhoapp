"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Drumstick,
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Wallet,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { logout } from "@/lib/domain/auth";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Kasir", icon: ShoppingCart },
  { href: "/settings/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/inventory", label: "Stok", icon: Package },
  { href: "/finance", label: "Keuangan", icon: Wallet },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sabana.sidebar") === "collapsed";
  });
  const pathname = usePathname();

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sabana.sidebar", next ? "collapsed" : "open");
      return next;
    });
  };

  return (
    <aside
      className={`hidden flex-col bg-brand text-white shadow-lg transition-all md:flex ${
        collapsed ? "w-16" : "w-52"
      }`}
    >
      <div className="flex items-center justify-between p-3">
        {!collapsed && (
          <span className="flex items-center gap-2 font-bold">
            <Drumstick size={20} /> Sabana
          </span>
        )}
        <button onClick={toggle} className="text-white/90" aria-label="Buka tutup menu samping">
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {links.map((l) => {
          // "/settings" (Pengaturan) pakai exact match karena "/settings/menu"
          // adalah item nav terpisah (Menu). Lainnya match sub-route.
          const active =
            l.href === "/settings"
              ? pathname === "/settings"
              : pathname === l.href || pathname.startsWith(l.href + "/");
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-white/20 font-semibold" : "hover:bg-white/10"
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span>{l.label}</span>}
            </Link>
          );
        })}
      </nav>
      <form action={logout} className="p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">
          <LogOut size={20} />
          {!collapsed && <span>Keluar</span>}
        </button>
      </form>
    </aside>
  );
}
