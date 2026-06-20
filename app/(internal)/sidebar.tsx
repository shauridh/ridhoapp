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
  Search,
  Printer,
} from "lucide-react";
import { logout } from "@/lib/domain/auth";
import { PosSubButton } from "./pos-sub-button";

interface SubLink {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  panel?: string;
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
  },
  { href: "/settings/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/inventory", label: "Stok", icon: Package },
  { href: "/finance", label: "Keuangan", icon: Wallet },
  { href: "/settings", label: "Pengaturan", icon: Settings, exact: true },
];

const posShortcuts: SubLink[] = [
  { href: "/pos", label: "Tersimpan", icon: Bookmark, panel: "held" },
  { href: "/pos", label: "Online", icon: Bell, panel: "online" },
  { href: "/pos/history", label: "Riwayat", icon: History },
  { href: "/pos", label: "Kelola Shift", icon: Receipt, panel: "shift" },
];

const POS_STORAGE_KEYS = {
  search: "pos.showSearch",
  print: "pos.showPrint",
} as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sabana.sidebar") === "collapsed";
  });
  const [posOpen, setPosOpen] = useState(true);
  const [showSearch, setShowSearch] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(POS_STORAGE_KEYS.search) === "true";
  });
  const [showPrint, setShowPrint] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(POS_STORAGE_KEYS.print) === "true";
  });
  const pathname = usePathname();

  const toggleSearch = () => {
    setShowSearch((prev) => {
      const next = !prev;
      localStorage.setItem(POS_STORAGE_KEYS.search, String(next));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pos:toggle-search", { detail: next }));
      }
      return next;
    });
  };

  const togglePrint = () => {
    setShowPrint((prev) => {
      const next = !prev;
      localStorage.setItem(POS_STORAGE_KEYS.print, String(next));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pos:toggle-print", { detail: next }));
      }
      return next;
    });
  };

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

  const onPos = pathname === "/pos" || pathname.startsWith("/pos/");

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

          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-white/20 font-semibold" : "hover:bg-white/10"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{l.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Shortcut POS — tampil di bawah nav, di atas logout */}
      {!collapsed && (
        <div className="border-t border-white/20 px-2 py-2">
          <button
            onClick={() => setPosOpen((p) => !p)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ShoppingCart size={14} className="shrink-0" />
            <span className="flex-1 text-left">Kasir</span>
            <ChevronDown
              size={12}
              className={`transition-transform ${posOpen ? "rotate-180" : ""}`}
            />
          </button>
          {posOpen && (
            <div className="mt-0.5 flex flex-col gap-0.5 border-l border-white/20 ml-2 pl-3">
              {posShortcuts.map((sub) => {
                const SubIcon = sub.icon;
                const subActive = sub.href !== "/pos" && pathname === sub.href;
                if (sub.panel) {
                  return (
                    <PosSubButton
                      key={sub.label}
                      label={sub.label}
                      icon={SubIcon}
                      panel={sub.panel}
                      active={onPos && subActive}
                    />
                  );
                }
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

              {/* Toggle Cari & Cetak */}
              <div className="mt-1 flex gap-1 border-t border-white/10 pt-1">
                <button
                  onClick={toggleSearch}
                  title={showSearch ? "Sembunyikan pencarian" : "Tampilkan pencarian"}
                  aria-label={showSearch ? "Sembunyikan pencarian" : "Tampilkan pencarian"}
                  className={`flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition ${
                    showSearch
                      ? "bg-white/20 font-semibold text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Search size={13} />
                  <span>Cari</span>
                </button>
                <button
                  onClick={togglePrint}
                  title={showPrint ? "Nonaktifkan cetak" : "Aktifkan cetak"}
                  aria-label={showPrint ? "Nonaktifkan cetak" : "Aktifkan cetak"}
                  className={`flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition ${
                    showPrint
                      ? "bg-white/20 font-semibold text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Printer size={13} />
                  <span>Cetak</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <form action={logout} className="p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">
          <LogOut size={20} />
          {!collapsed && <span>Keluar</span>}
        </button>
      </form>
    </aside>
  );
}
