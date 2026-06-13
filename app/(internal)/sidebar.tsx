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
  Bookmark,
  Bell,
  History,
  Receipt,
  ChevronDown,
} from "lucide-react";
import { logout } from "@/lib/domain/auth";

interface SubLink {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  children?: SubLink[];
}

const links: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/pos",
    label: "Kasir",
    icon: ShoppingCart,
    children: [
      { href: "/pos?panel=held", label: "Tersimpan", icon: Bookmark },
      { href: "/pos?panel=online", label: "Online", icon: Bell },
      { href: "/pos/history", label: "Riwayat", icon: History },
      { href: "/pos?panel=shift", label: "Kelola Shift", icon: Receipt },
    ],
  },
  { href: "/settings/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/inventory", label: "Stok", icon: Package },
  { href: "/finance", label: "Keuangan", icon: Wallet },
  { href: "/settings", label: "Pengaturan", icon: Settings, exact: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sabana.sidebar") === "collapsed";
  });
  const [openGroup, setOpenGroup] = useState<string | null>("/pos");
  const pathname = usePathname();

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sabana.sidebar", next ? "collapsed" : "open");
      return next;
    });
  };

  const isActive = (href: string, exact?: boolean) => {
    const path = href.split("?")[0];
    if (exact) return pathname === path;
    return pathname === path || pathname.startsWith(path + "/");
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
        <button
          onClick={toggle}
          className="text-white/90"
          aria-label={collapsed ? "Buka menu samping" : "Tutup menu samping"}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-1">
        {links.map((l) => {
          const active = isActive(l.href, l.exact);
          const Icon = l.icon;
          const hasChildren = l.children && l.children.length > 0;
          const groupOpen = openGroup === l.href;

          return (
            <div key={l.href}>
              {hasChildren ? (
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-white/20 font-semibold" : "hover:bg-white/10"}`}
                >
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className="flex flex-1 items-center gap-3"
                  >
                    <Icon size={20} className="shrink-0" />
                    {!collapsed && <span className="flex-1">{l.label}</span>}
                  </Link>
                  {!collapsed && (
                    <button
                      onClick={() => setOpenGroup(groupOpen ? null : l.href)}
                      aria-expanded={groupOpen}
                      aria-label={
                        groupOpen ? `Tutup submenu ${l.label}` : `Buka submenu ${l.label}`
                      }
                      className="shrink-0 rounded p-0.5 hover:bg-white/20"
                    >
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${groupOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
              ) : (
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-white/20 font-semibold" : "hover:bg-white/10"
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && <span>{l.label}</span>}
                </Link>
              )}

              {hasChildren && groupOpen && !collapsed && (
                <div className="ml-2 mt-0.5 flex flex-col gap-0.5 border-l border-white/20 pl-3">
                  {l.children!.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive =
                      pathname === sub.href.split("?")[0] && sub.href.split("?")[0] !== "/pos";
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        aria-current={subActive ? "page" : undefined}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                          subActive
                            ? "bg-white/20 font-semibold"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <SubIcon size={14} />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
