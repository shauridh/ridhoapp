"use client"

import { useEffect, useState } from "react"
import { logout } from "@/lib/domain/auth"

const links = [
  { href: "/pos", label: "Kasir", icon: "🛒" },
  { href: "/settings/menu", label: "Menu", icon: "📋" },
  { href: "/inventory", label: "Stok", icon: "📦" },
  { href: "/pos/shift", label: "Shift", icon: "🧾" },
  { href: "/finance", label: "Keuangan", icon: "💰" },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sabana.sidebar")
    if (saved === "collapsed") setCollapsed(true)
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("sabana.sidebar", next ? "collapsed" : "open")
      return next
    })
  }

  return (
    <aside
      className={`flex flex-col bg-brand text-white transition-all ${
        collapsed ? "w-14" : "w-48"
      }`}
    >
      <div className="flex items-center justify-between p-3">
        {!collapsed && <span className="font-bold">🍗 Sabana</span>}
        <button
          onClick={toggle}
          className="text-xl leading-none"
          aria-label="Buka tutup menu samping"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/15"
          >
            <span>{l.icon}</span>
            {!collapsed && <span>{l.label}</span>}
          </a>
        ))}
      </nav>
      <form action={logout} className="p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/15">
          <span>🚪</span>
          {!collapsed && <span>Keluar</span>}
        </button>
      </form>
    </aside>
  )
}
