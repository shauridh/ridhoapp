# Fase A: Fondasi UI Depth - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Tambah depth visual (shadow, rounded-2xl, ikon lucide, chip ikon KPI, active:scale) + mobile bottom-nav ke ridhoapp, tetap palet krem Sabana. Murni presentasi.

**Architecture:** Pasang lucide-react. Tambah token tint di globals.css. Upgrade Card/Button, buat StatCard & IconButton. Sidebar pakai ikon lucide + BottomNav untuk HP. Terapkan ke layar kasir & keuangan. Tanpa perubahan data/logic.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, lucide-react.

**Referensi spec:** `docs/superpowers/specs/2026-06-11-fase-a-ui-depth-design.md`

---

## Task 1: Pasang lucide-react + token tint

**Files:** Modify `package.json`, `app/globals.css`

- [ ] **Step 1: Install lucide-react**

Run: `npm install lucide-react`
Expected: tertambah di dependencies.

- [ ] **Step 2: Tambah token tint di globals.css**

Di `app/globals.css`, dalam blok `@theme`, tambahkan setelah `--color-hairline`:
```css
  --color-tint-red: #FEECEC;
  --color-tint-green: #E9F8EF;
  --color-tint-amber: #FEF6E7;
  --color-tint-blue: #EAF1FE;
```

- [ ] **Step 3: Build & commit**

Run: `npm run build` (sukses)
```bash
git add package.json package-lock.json app/globals.css
git commit -m "feat(ui): add lucide-react and tint tokens"
```

---

## Task 2: Upgrade Card + buat StatCard & IconButton

**Files:** Modify `components/ui/card.tsx`; Create `components/ui/stat-card.tsx`, `components/ui/icon-button.tsx`

- [ ] **Step 1: Upgrade Card dengan prop interactive**

Ganti isi `components/ui/card.tsx`:
```tsx
import { type HTMLAttributes } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive = false, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-hairline bg-white p-4 shadow-sm ${
        interactive ? "cursor-pointer transition hover:shadow-lg active:scale-[0.97]" : ""
      } ${className}`}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Buat StatCard**

Buat `components/ui/stat-card.tsx`:
```tsx
import { type LucideIcon } from "lucide-react"

type Tone = "red" | "green" | "amber" | "blue"

const toneChip: Record<Tone, string> = {
  red: "bg-tint-red text-brand",
  green: "bg-tint-green text-success",
  amber: "bg-tint-amber text-accent",
  blue: "bg-tint-blue text-blue-600",
}

const toneValue: Record<Tone, string> = {
  red: "text-brand",
  green: "text-success",
  amber: "text-ink",
  blue: "text-blue-600",
}

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: Tone
}

export function StatCard({ label, value, icon: Icon, tone = "red" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneChip[tone]}`}>
          <Icon size={18} />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${toneValue[tone]}`}>{value}</p>
    </div>
  )
}
```

- [ ] **Step 3: Buat IconButton**

Buat `components/ui/icon-button.tsx`:
```tsx
import { type LucideIcon } from "lucide-react"

interface IconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  className?: string
}

export function IconButton({ icon: Icon, label, onClick, className = "" }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-white text-ink transition active:scale-[0.95] hover:bg-surface ${className}`}
    >
      <Icon size={18} />
    </button>
  )
}
```

- [ ] **Step 4: Build & commit**

Run: `npm run build` (sukses)
```bash
git add components/ui/card.tsx components/ui/stat-card.tsx components/ui/icon-button.tsx
git commit -m "feat(ui): upgrade Card, add StatCard and IconButton"
```

---

## Task 3: Upgrade Button dengan ikon

**Files:** Modify `components/ui/button.tsx`

- [ ] **Step 1: Tambah prop icon ke Button**

Ganti isi `components/ui/button.tsx`:
```tsx
import { type ButtonHTMLAttributes } from "react"
import { type LucideIcon } from "lucide-react"

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success"
type Size = "md" | "lg"

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
  secondary: "bg-accent text-ink hover:brightness-95 shadow-sm",
  ghost: "bg-white text-ink border border-hairline hover:bg-surface",
  danger: "bg-danger text-white hover:brightness-95 shadow-sm",
  success: "bg-success text-white hover:brightness-95 shadow-sm",
}

const sizes: Record<Size, string> = {
  md: "px-4 py-2 text-sm min-h-[44px]",
  lg: "px-6 py-3 text-base min-h-[52px]",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: LucideIcon
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && !loading && <Icon size={18} />}
      {loading ? "Memuat..." : children}
    </button>
  )
}
```

- [ ] **Step 2: Build & commit**

Run: `npm run build` (sukses)
```bash
git add components/ui/button.tsx
git commit -m "feat(ui): add icon support and press feedback to Button"
```

---

## Task 4: Sidebar pakai ikon lucide

**Files:** Modify `app/(internal)/sidebar.tsx`

- [ ] **Step 1: Ganti emoji jadi ikon lucide + deteksi rute aktif**

Ganti isi `app/(internal)/sidebar.tsx`:
```tsx
"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Drumstick,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Receipt,
  Wallet,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { logout } from "@/lib/domain/auth"

const links = [
  { href: "/pos", label: "Kasir", icon: ShoppingCart },
  { href: "/settings/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/inventory", label: "Stok", icon: Package },
  { href: "/pos/shift", label: "Shift", icon: Receipt },
  { href: "/finance", label: "Keuangan", icon: Wallet },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

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
      className={`hidden md:flex flex-col bg-brand text-white shadow-lg transition-all ${
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
          const active = pathname === l.href || pathname.startsWith(l.href + "/")
          const Icon = l.icon
          return (
            <a
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-white/20 font-semibold" : "hover:bg-white/10"
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span>{l.label}</span>}
            </a>
          )
        })}
      </nav>
      <form action={logout} className="p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">
          <LogOut size={20} />
          {!collapsed && <span>Keluar</span>}
        </button>
      </form>
    </aside>
  )
}
```

CATATAN: aktif menggunakan exact match + prefix dengan "/" agar `/pos` tidak ikut aktif saat di `/pos/shift` kecuali memang prefix shift. Karena `/pos/shift` diawali `/pos/`, link Kasir akan aktif juga saat di shift — terima ini (Shift adalah sub dari pos). Shift tetap punya highlight sendiri karena exact match `/pos/shift`.

- [ ] **Step 2: Build & commit**

Run: `npm run build` (sukses)
```bash
git add "app/(internal)/sidebar.tsx"
git commit -m "feat(ui): sidebar with lucide icons and active state"
```

---

## Task 5: BottomNav untuk mobile

**Files:** Create `app/(internal)/bottom-nav.tsx`; Modify `app/(internal)/layout.tsx`

- [ ] **Step 1: Buat bottom-nav.tsx**

Buat `app/(internal)/bottom-nav.tsx`:
```tsx
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
```

- [ ] **Step 2: Render BottomNav + padding di layout**

Di `app/(internal)/layout.tsx`, import `BottomNav` dan render setelah `<main>`, lalu beri padding bawah pada main. Ganti blok return menjadi:
```tsx
  return (
    <ToastProvider>
      <DialogProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden p-4 pb-20 md:pb-4">{children}</main>
          <BottomNav />
        </div>
      </DialogProvider>
    </ToastProvider>
  )
```
Tambahkan import: `import { BottomNav } from "./bottom-nav"`.

- [ ] **Step 3: Build & commit**

Run: `npm run build` (sukses)
```bash
git add "app/(internal)/bottom-nav.tsx" "app/(internal)/layout.tsx"
git commit -m "feat(ui): add mobile bottom navigation"
```

---

## Task 6: Terapkan StatCard ke Keuangan

**Files:** Modify `app/(internal)/finance/page.tsx`

- [ ] **Step 1: Ganti 4 KPI div jadi StatCard**

Di `app/(internal)/finance/page.tsx`, import StatCard + ikon:
```tsx
import { StatCard } from "@/components/ui/stat-card"
import { TrendingUp, Receipt, BarChart3, Wallet } from "lucide-react"
```
Ganti blok grid 4 KPI (yang sekarang pakai Card manual) menjadi:
```tsx
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Pemasukan" tone="green" icon={TrendingUp} value={`Rp ${summary.totalIncome.toLocaleString("id-ID")}`} />
        <StatCard label="Pengeluaran (OpEx)" tone="red" icon={Receipt} value={`Rp ${summary.totalOpex.toLocaleString("id-ID")}`} />
        <StatCard label="Laba Kotor" tone="amber" icon={BarChart3} value={`Rp ${summary.grossProfit.toLocaleString("id-ID")}`} />
        <StatCard label="Belanja Modal" tone="blue" icon={Wallet} value={`Rp ${summary.totalCapex.toLocaleString("id-ID")}`} />
      </div>
```
(Pertahankan data summary.* yang sudah ada; hanya ganti presentasi.)

- [ ] **Step 2: Build & commit**

Run: `npm run build` (sukses)
```bash
git add "app/(internal)/finance/page.tsx"
git commit -m "feat(ui): use StatCard for finance KPIs"
```

---

## Task 7: Terapkan depth ke kartu produk kasir + ikon tombol

**Files:** Modify `app/(internal)/pos/product-grid.tsx`, `app/(internal)/pos/cart.tsx`

- [ ] **Step 1: Kartu produk pakai rounded-2xl + hover lift**

Di `app/(internal)/pos/product-grid.tsx`, pada `<button>` kartu produk ganti className menjadi:
```tsx
            className="overflow-hidden rounded-2xl border border-hairline bg-white text-center shadow-sm transition hover:shadow-lg active:scale-[0.97]"
```
(Hanya className; struktur & logic tetap.)

- [ ] **Step 2: Tombol bayar pakai ikon**

Di `app/(internal)/pos/cart.tsx`, import ikon:
```tsx
import { Banknote, QrCode } from "lucide-react"
```
Tambahkan `icon={Banknote}` pada Button Tunai dan `icon={QrCode}` pada Button QRIS (Button sudah mendukung prop icon dari Task 3).

- [ ] **Step 3: Build & commit**

Run: `npm run build` (sukses)
```bash
git add "app/(internal)/pos/product-grid.tsx" "app/(internal)/pos/cart.tsx"
git commit -m "feat(ui): add depth to product cards and icons to pay buttons"
```

---

## Task 8: Verifikasi akhir

- [ ] **Step 1: Build & test**

Run: `npm run build` (sukses, semua route muncul)
Run: `npm test` (27 test tetap lulus)

- [ ] **Step 2: Verifikasi manual**

`npm run dev`, login. Cek: sidebar ikon lucide + highlight aktif; di layar sempit bottom-nav muncul & sidebar hilang; KPI keuangan pakai chip ikon berwarna; kartu produk terangkat saat hover & mengecil saat ditekan; tombol bayar ada ikon. Hard refresh (Ctrl+Shift+R).

- [ ] **Step 3: Commit dokumen plan**

```bash
git add docs/superpowers/plans/2026-06-11-plan-fase-a-ui-depth.md
git commit -m "docs: add Fase A implementation plan"
```

---

## Catatan Penyelesaian

Setelah Fase A: ridhoapp punya depth (shadow, rounded, ikon lucide, chip KPI, feedback tekan) + mobile bottom-nav, tetap krem Sabana. Lanjut Fase B (Kasir lengkap: addon, payment modal, receipt) di putaran berikutnya.