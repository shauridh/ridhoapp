"use client"

import { usePathname } from "next/navigation"
import { ShoppingCart, Package, UtensilsCrossed, Wallet, Receipt } from "lucide-react"

const links = [
  { href: "/pos", label: "Kasir", icon: ShoppingCart },
  { href: "/inventory", label: "Stok", icon: Package },
  { href: "/settings/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/finance", label: "Keuangan", icon: Wallet },
  { href: "/pos/shift", label: "Shift", icon: Receipt },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline bg-white md:hidden">
      {links.map((l) => {
        const active = pathname === l.href
        const Icon = l.icon
        return (
          <a
            key={l.href}
            href={l.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              active ? "text-brand" : "text-ink-soft"
            }`}
          >
            <Icon size={20} />
            {l.label}
          </a>
        )
      })}
    </nav>
  )
}
