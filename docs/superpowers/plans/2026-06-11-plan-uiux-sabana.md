# Plan UI/UX Sabana POS - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memoles UI/UX menjadi bergaya brand Sabana (merah/kuning/krem, Plus Jakarta Sans): membangun design tokens, komponen reusable (Button, Card, Modal, Confirm/Prompt, Toast, Input, Select, Badge), App Shell sidebar collapsible, lalu menerapkan penuh ke halaman Kasir.

**Architecture:** Token warna via CSS variables di globals.css + util Tailwind. Komponen di `components/ui/`. Toast & dialog (Confirm/Prompt) berbasis React Context + Promise menggantikan alert()/prompt(). App Shell sidebar collapsible di layout internal. Kasir memakai komponen baru + grid responsif dengan jumlah kolom konfigurabel (localStorage).

**Tech Stack:** Next.js 16 (App Router, Client Components), React 19, Tailwind CSS v4, Plus Jakarta Sans via next/font/google, Vitest.

**Referensi spec:** `docs/superpowers/specs/2026-06-11-uiux-sabana-design.md`

**Catatan Next.js 16:** Baca `node_modules/next/dist/docs/` untuk next/font, Client Components, dan metadata bila perlu.

---

## File Structure

- `app/globals.css` - tambah CSS variables token Sabana + util
- `app/layout.tsx` - pasang font Plus Jakarta Sans
- `tailwind.config` / `@theme` - map token ke util (sesuai Tailwind v4)
- `components/ui/button.tsx` - Button
- `components/ui/card.tsx` - Card
- `components/ui/badge.tsx` - Badge
- `components/ui/input.tsx` - Input & Select
- `components/ui/modal.tsx` - Modal dasar
- `components/ui/toast.tsx` - ToastProvider + useToast
- `components/ui/dialog.tsx` - ConfirmDialog + PromptDialog (DialogProvider + useDialog)
- `app/(internal)/layout.tsx` - App Shell sidebar collapsible + provider
- `app/(internal)/sidebar.tsx` - komponen sidebar (client)
- `lib/domain/grid.ts` - util kolom grid (pure, testable)
- `lib/domain/grid.test.ts` - unit test
- `app/(internal)/pos/*` - terapkan komponen baru ke kasir
- `supabase/migrations/0005_product_image.sql` - kolom image_url

---

## Task 1: Pasang font Plus Jakarta Sans

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Cek isi app/layout.tsx saat ini**

Run: baca `app/layout.tsx`. Catat ekspor `metadata`, `viewport`, dan setup font scaffold (Geist) yang ada.

- [ ] **Step 2: Ganti font ke Plus Jakarta Sans**

Di `app/layout.tsx`, ganti import font Geist dengan:

```tsx
import { Plus_Jakarta_Sans } from "next/font/google"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
})
```

Terapkan `className={jakarta.variable}` pada elemen `<html>` (atau `<body>`), dan pastikan `<body>` memakai font via `font-sans`. Hapus referensi Geist yang tidak dipakai lagi.

- [ ] **Step 3: Verifikasi build**

Run: `npm run build`
Expected: sukses, tidak ada error import font.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(ui): use Plus Jakarta Sans font"
```

---

## Task 2: Design tokens (warna Sabana)

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Cek globals.css & cara Tailwind v4 mendefinisikan tema**

Run: baca `app/globals.css`. Next.js 16 + Tailwind v4 memakai `@import "tailwindcss"` dan blok `@theme`. Catat strukturnya.

- [ ] **Step 2: Tambah token Sabana ke @theme**

Di `app/globals.css`, di dalam blok `@theme` (atau buat bila perlu), tambahkan:

```css
@theme {
  --color-brand: #E11B22;
  --color-brand-dark: #B31419;
  --color-accent: #FDB913;
  --color-surface: #FBF3E4;
  --color-ink: #1F2937;
  --color-ink-soft: #6B7280;
  --color-success: #16A34A;
  --color-danger: #DC2626;
  --color-hairline: #EADFC8;
  --font-sans: var(--font-jakarta), system-ui, sans-serif;
}
```

Lalu set latar aplikasi default ke surface. Setelah blok theme, tambahkan:

```css
body {
  background-color: var(--color-surface);
  color: var(--color-ink);
}
```

Token ini menghasilkan util seperti `bg-brand`, `bg-accent`, `bg-surface`, `text-ink`, `text-ink-soft`, `bg-success`, `text-danger`, `border-hairline`.

- [ ] **Step 3: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): add Sabana color design tokens"
```

---

## Task 3: Komponen Button, Card, Badge

**Files:**
- Create: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`

- [ ] **Step 1: Buat components/ui/button.tsx**

```tsx
import { type ButtonHTMLAttributes } from "react"

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success"
type Size = "md" | "lg"

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-accent text-ink hover:brightness-95",
  ghost: "bg-white text-ink border border-hairline hover:bg-surface",
  danger: "bg-danger text-white hover:brightness-95",
  success: "bg-success text-white hover:brightness-95",
}

const sizes: Record<Size, string> = {
  md: "px-4 py-2 text-sm min-h-[44px]",
  lg: "px-6 py-3 text-base min-h-[52px]",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? "Memuat..." : children}
    </button>
  )
}
```

- [ ] **Step 2: Buat components/ui/card.tsx**

```tsx
import { type HTMLAttributes } from "react"

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl bg-white p-4 shadow-sm ${className}`}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Buat components/ui/badge.tsx**

```tsx
import { type HTMLAttributes } from "react"

type Tone = "neutral" | "accent" | "success" | "danger"

const tones: Record<Tone, string> = {
  neutral: "bg-surface text-ink-soft",
  accent: "bg-accent text-ink",
  success: "bg-green-100 text-success",
  danger: "bg-red-100 text-danger",
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
      {...props}
    />
  )
}
```

- [ ] **Step 4: Verifikasi build & commit**

```bash
npm run build
git add components/ui/button.tsx components/ui/card.tsx components/ui/badge.tsx
git commit -m "feat(ui): add Button, Card, Badge components"
```

---

## Task 4: Komponen Input & Select

**Files:**
- Create: `components/ui/input.tsx`

- [ ] **Step 1: Buat components/ui/input.tsx**

```tsx
import { type InputHTMLAttributes, type SelectHTMLAttributes } from "react"

const baseField =
  "w-full rounded-lg border border-hairline bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-ink-soft">{label}</span>}
      <input className={`${baseField} ${className}`} {...props} />
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className = "", children, ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-ink-soft">{label}</span>}
      <select className={`${baseField} ${className}`} {...props}>
        {children}
      </select>
    </label>
  )
}
```

- [ ] **Step 2: Verifikasi build & commit**

```bash
npm run build
git add components/ui/input.tsx
git commit -m "feat(ui): add Input and Select components"
```

---

## Task 5: Komponen Modal

**Files:**
- Create: `components/ui/modal.tsx`

- [ ] **Step 1: Buat components/ui/modal.tsx**

```tsx
"use client"

import { type ReactNode, useEffect } from "react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="mb-3 text-lg font-semibold text-ink">{title}</h3>}
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verifikasi build & commit**

```bash
npm run build
git add components/ui/modal.tsx
git commit -m "feat(ui): add Modal component"
```

---

## Task 6: Toast (Provider + useToast)

**Files:**
- Create: `components/ui/toast.tsx`

- [ ] **Step 1: Buat components/ui/toast.tsx**

```tsx
"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

type ToastTone = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneClasses: Record<ToastTone, string> = {
  success: "bg-success text-white",
  error: "bg-danger text-white",
  info: "bg-ink text-white",
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-lg ${toneClasses[t.tone]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast harus dipakai di dalam ToastProvider")
  return ctx
}
```

- [ ] **Step 2: Verifikasi build & commit**

```bash
npm run build
git add components/ui/toast.tsx
git commit -m "feat(ui): add Toast provider and useToast hook"
```

---

## Task 7: Dialog (ConfirmDialog + PromptDialog via Promise)

**Files:**
- Create: `components/ui/dialog.tsx`

- [ ] **Step 1: Buat components/ui/dialog.tsx**

```tsx
"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Modal } from "./modal"
import { Button } from "./button"
import { Input } from "./input"

interface DialogContextValue {
  confirm: (message: string, title?: string) => Promise<boolean>
  prompt: (message: string, title?: string) => Promise<string | null>
}

const DialogContext = createContext<DialogContextValue | null>(null)

type DialogState =
  | { kind: "none" }
  | { kind: "confirm"; message: string; title?: string }
  | { kind: "prompt"; message: string; title?: string }

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({ kind: "none" })
  const [value, setValue] = useState("")
  const resolver = useRef<((result: unknown) => void) | null>(null)

  const close = () => setState({ kind: "none" })

  const confirm = useCallback((message: string, title?: string) => {
    setState({ kind: "confirm", message, title })
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve as (r: unknown) => void
    })
  }, [])

  const prompt = useCallback((message: string, title?: string) => {
    setValue("")
    setState({ kind: "prompt", message, title })
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve as (r: unknown) => void
    })
  }, [])

  const settle = (result: boolean | string | null) => {
    resolver.current?.(result)
    resolver.current = null
    close()
  }

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      <Modal
        open={state.kind !== "none"}
        onClose={() => settle(state.kind === "confirm" ? false : null)}
        title={state.kind !== "none" ? state.title : undefined}
      >
        {state.kind !== "none" && (
          <div className="space-y-4">
            <p className="text-ink">{state.message}</p>
            {state.kind === "prompt" && (
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => settle(state.kind === "confirm" ? false : null)}
              >
                Batal
              </Button>
              <Button
                onClick={() =>
                  settle(state.kind === "confirm" ? true : value)
                }
              >
                OK
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error("useDialog harus dipakai di dalam DialogProvider")
  return ctx
}
```

- [ ] **Step 2: Verifikasi build & commit**

```bash
npm run build
git add components/ui/dialog.tsx
git commit -m "feat(ui): add Confirm/Prompt dialog provider"
```

---

## Task 8: Util kolom grid (TDD)

**Files:**
- Create: `lib/domain/grid.ts`, `lib/domain/grid.test.ts`

- [ ] **Step 1: Tulis failing test**

```typescript
import { describe, it, expect } from "vitest"
import { gridStyle, type GridSetting } from "./grid"

describe("gridStyle", () => {
  it("memakai auto-fill untuk Auto", () => {
    expect(gridStyle("auto").gridTemplateColumns).toBe(
      "repeat(auto-fill, minmax(140px, 1fr))",
    )
  })

  it("mengunci jumlah kolom untuk angka", () => {
    expect(gridStyle(4).gridTemplateColumns).toBe("repeat(4, 1fr)")
  })
})
```

- [ ] **Step 2: Run test, confirm FAIL**

Run: `npm test -- grid`
Expected: FAIL.

- [ ] **Step 3: Implement lib/domain/grid.ts**

```typescript
export type GridSetting = "auto" | 3 | 4 | 5

export function gridStyle(setting: GridSetting): { gridTemplateColumns: string } {
  if (setting === "auto") {
    return { gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }
  }
  return { gridTemplateColumns: `repeat(${setting}, 1fr)` }
}
```

- [ ] **Step 4: Run test, confirm PASS**

Run: `npm test -- grid`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/grid.ts lib/domain/grid.test.ts
git commit -m "feat(ui): add grid column setting util"
```

---

## Task 9: App Shell — Sidebar collapsible + provider

**Files:**
- Create: `app/(internal)/sidebar.tsx`
- Modify: `app/(internal)/layout.tsx`

- [ ] **Step 1: Buat app/(internal)/sidebar.tsx (client)**

```tsx
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
        <button onClick={toggle} className="text-xl leading-none" aria-label="Toggle sidebar">
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
```

- [ ] **Step 2: Ubah app/(internal)/layout.tsx jadi shell sidebar + provider**

Ganti isi layout (tetap pertahankan cek auth & redirect) menjadi:

```tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "./sidebar"
import { ToastProvider } from "@/components/ui/toast"
import { DialogProvider } from "@/components/ui/dialog"

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <ToastProvider>
      <DialogProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden p-4">{children}</main>
        </div>
      </DialogProvider>
    </ToastProvider>
  )
}
```

- [ ] **Step 3: Verifikasi build**

Run: `npm run build`
Expected: sukses, semua route tetap muncul.

- [ ] **Step 4: Commit**

```bash
git add "app/(internal)/sidebar.tsx" "app/(internal)/layout.tsx"
git commit -m "feat(ui): add collapsible sidebar app shell"
```

---

## Task 10: Kolom gambar produk

**Files:**
- Create: `supabase/migrations/0005_product_image.sql`
- Modify: `lib/data/products.ts`

- [ ] **Step 1: Buat migration**

Buat `supabase/migrations/0005_product_image.sql`:

```sql
alter table public.products add column image_url text;
```

- [ ] **Step 2: Tambah image_url ke ProductRow**

Di `lib/data/products.ts`, tambahkan field `image_url: string | null` ke interface `ProductRow` (setelah `category`).

- [ ] **Step 3: Commit & terapkan**

```bash
git add supabase/migrations/0005_product_image.sql lib/data/products.ts
git commit -m "feat: add product image_url column"
```

Jalankan SQL di Supabase SQL Editor. (Butuh konfirmasi pengguna sebelum lanjut ke task yang memakai gambar.)

---

## Task 11: Field gambar di form menu

**Files:**
- Modify: `app/(internal)/settings/menu/product-form.tsx`, `app/(internal)/settings/menu/actions.ts`

- [ ] **Step 1: Tambah input URL gambar di product-form.tsx**

Tambahkan satu field input di form (gunakan komponen Input baru bila mudah, atau input biasa konsisten gaya):

```tsx
<input name="imageUrl" placeholder="URL gambar (opsional)" className="rounded border px-2 py-1" />
```

- [ ] **Step 2: Simpan image_url di createProduct (actions.ts)**

Di `app/(internal)/settings/menu/actions.ts`, di `parseProductForm`, tambahkan:

```typescript
imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
```

dan di `ProductInput`-like usage saat insert/update tambahkan kolom `image_url: input.imageUrl`. (Sesuaikan: jika ProductInput dari domain tidak punya field ini, baca `formData.get("imageUrl")` langsung di action dan masukkan ke objek insert/update sebagai `image_url`.)

- [ ] **Step 3: Verifikasi build & commit**

```bash
npm run build
git add "app/(internal)/settings/menu/product-form.tsx" "app/(internal)/settings/menu/actions.ts"
git commit -m "feat: add product image url field in menu form"
```

---

## Task 12: Terapkan komponen baru ke kartu produk kasir (grid responsif)

**Files:**
- Modify: `app/(internal)/pos/product-grid.tsx`

- [ ] **Step 1: Ubah product-grid.tsx jadi kartu kotak + gambar + grid konfigurabel**

Ganti isi `ProductGrid` agar memakai grid dengan kontrol kolom dan kartu kotak. Komponen menerima `cols` dan `onColsChange`:

```tsx
"use client"

import type { ProductRow } from "@/lib/data/products"
import { gridStyle, type GridSetting } from "@/lib/domain/grid"

interface Props {
  products: ProductRow[]
  onSelect: (product: ProductRow) => void
  cols: GridSetting
  onColsChange: (cols: GridSetting) => void
}

const options: GridSetting[] = ["auto", 3, 4, 5]

export function ProductGrid({ products, onSelect, cols, onColsChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={String(o)}
            onClick={() => onColsChange(o)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              cols === o ? "bg-brand text-white" : "bg-white text-ink border border-hairline"
            }`}
          >
            {o === "auto" ? "Auto" : `${o} kolom`}
          </button>
        ))}
      </div>
      <div className="grid gap-3" style={gridStyle(cols)}>
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="overflow-hidden rounded-xl bg-white text-center shadow-sm transition hover:shadow-md active:scale-[0.98]"
          >
            <div className="aspect-square bg-surface">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">🍗</div>
              )}
            </div>
            <div className="p-2">
              <div className="text-sm font-bold text-ink">{p.name}</div>
              <div className="text-sm font-bold text-brand">
                Rp {p.base_price.toLocaleString("id-ID")}
              </div>
            </div>
          </button>
        ))}
        {products.length === 0 && (
          <p className="col-span-full py-8 text-center text-ink-soft">Belum ada produk aktif.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verifikasi build & commit**

```bash
npm run build
git add "app/(internal)/pos/product-grid.tsx"
git commit -m "feat(ui): square product cards with image and configurable grid"
```

---

## Task 13: Terapkan komponen baru ke halaman kasir (cart, toast, modal, grid state)

**Files:**
- Modify: `app/(internal)/pos/page.tsx`, `app/(internal)/pos/cart.tsx`

- [ ] **Step 1: Update pos/page.tsx**

Di `app/(internal)/pos/page.tsx`:
- Tambah state `cols` bertipe `GridSetting`, inisialisasi dari `localStorage` (key `pos.gridCols`, default `"auto"`), dan simpan saat berubah.
- Teruskan `cols` & `onColsChange` ke `ProductGrid`.
- Ganti `alert(result.error)` pada checkout gagal dengan `useToast().show(result.error, "error")`, dan tampilkan toast sukses `show("Transaksi berhasil", "success")` saat berhasil.
- Import: `import { useToast } from "@/components/ui/toast"` dan `import type { GridSetting } from "@/lib/domain/grid"`.

Contoh potongan state grid:

```tsx
const [cols, setCols] = useState<GridSetting>("auto")
useEffect(() => {
  const saved = localStorage.getItem("pos.gridCols")
  if (saved === "3" || saved === "4" || saved === "5") setCols(Number(saved) as GridSetting)
  else if (saved === "auto") setCols("auto")
}, [])
const changeCols = (c: GridSetting) => {
  setCols(c)
  localStorage.setItem("pos.gridCols", String(c))
}
```

Contoh toast pada handleCheckout:

```tsx
const toast = useToast()
// ...
if (result.ok) {
  toast.show("Transaksi berhasil", "success")
  // set receipt + reset cart seperti sebelumnya
} else {
  toast.show(result.error, "error")
}
```

- [ ] **Step 2: Rapikan cart.tsx dengan komponen Button**

Di `app/(internal)/pos/cart.tsx`, ganti tombol Tunai/QRIS memakai komponen `Button` (`variant="success"` untuk Tunai, `variant="secondary"` untuk QRIS, `size="lg"`), dan pastikan warna teks/aksen ikut token. Pertahankan props & handler yang ada.

- [ ] **Step 3: Verifikasi build & commit**

```bash
npm run build
git add "app/(internal)/pos/page.tsx" "app/(internal)/pos/cart.tsx"
git commit -m "feat(ui): apply toast and grid settings to cashier page"
```

---

## Task 14: Riwayat transaksi + void (Toast + Dialog)

**Files:**
- Create: `app/(internal)/pos/order-history.tsx`
- Modify: `app/(internal)/pos/page.tsx`

CATATAN: Plan 3 tidak membuat UI riwayat/void. Task ini membuatnya dari awal memakai komponen baru (Toast + Dialog), bukan mengganti kode lama. Server action `voidOrder` sudah ada di `app/(internal)/pos/actions.ts`.

- [ ] **Step 1: Buat app/(internal)/pos/order-history.tsx (client)**

```tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { voidOrder } from "./actions"
import { useToast } from "@/components/ui/toast"
import { useDialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  total: number
  payment_method: string
  status: string
  void_reason: string | null
  created_at: string
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [show, setShow] = useState(false)
  const toast = useToast()
  const dialog = useDialog()

  useEffect(() => {
    if (!show) return
    const supabase = createClient()
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setOrders(data ?? []))
  }, [show])

  const handleVoid = async (id: string) => {
    const reason = await dialog.prompt("Masukkan alasan void:", "Void Transaksi")
    if (!reason) return
    const result = await voidOrder(id, reason)
    if (result.ok) {
      toast.show("Transaksi dibatalkan", "success")
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: "voided", void_reason: reason } : o,
        ),
      )
    } else {
      toast.show(result.error, "error")
    }
  }

  return (
    <div>
      <button onClick={() => setShow(!show)} className="text-sm text-ink-soft underline">
        {show ? "Sembunyikan Riwayat" : "Riwayat Transaksi"}
      </button>
      {show && (
        <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
          {orders.length === 0 && (
            <p className="py-2 text-center text-sm text-ink-soft">Belum ada.</p>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border border-hairline bg-white px-3 py-2 text-sm"
            >
              <div>
                <div className="font-semibold text-ink">
                  Rp {o.total.toLocaleString("id-ID")}{" "}
                  <Badge tone={o.payment_method === "cash" ? "success" : "accent"}>
                    {o.payment_method.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-ink-soft">
                  {new Date(o.created_at).toLocaleString("id-ID")}
                </div>
              </div>
              {o.status === "completed" ? (
                <Button variant="danger" size="md" onClick={() => handleVoid(o.id)}>
                  Void
                </Button>
              ) : (
                <Badge tone="danger">Dibatalkan</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Render OrderHistory di pos/page.tsx**

Di `app/(internal)/pos/page.tsx`, import `OrderHistory` dan render di bawah panel keranjang (kolom kanan), mis. setelah komponen `CartView`. Pastikan tetap di dalam JSX kolom kanan.

```tsx
import { OrderHistory } from "./order-history"
// ... di dalam kolom kanan, setelah <CartView ... />:
<div className="mt-4">
  <OrderHistory />
</div>
```

- [ ] **Step 3: Verifikasi build & commit**

```bash
npm run build
git add "app/(internal)/pos/order-history.tsx" "app/(internal)/pos/page.tsx"
git commit -m "feat(ui): add order history with void via dialog and toast"
```

---

## Task 15: Verifikasi akhir & navigasi

- [ ] **Step 1: Build & test**

Run: `npm run build` — sukses, semua route muncul.
Run: `npm test` — semua test lulus (termasuk grid: 2 test baru).

- [ ] **Step 2: Verifikasi manual (tablet)**

Jalankan `npm run dev`, login. Cek: sidebar buka/tutup tersimpan; halaman kasir tampil kartu kotak + gambar/placeholder; ganti kolom grid (Auto/3/4/5) tersimpan; checkout memunculkan toast sukses; error memunculkan toast; void memunculkan dialog alasan. Pastikan warna & font Sabana konsisten.

- [ ] **Step 3: Commit dokumen plan**

```bash
git add docs/superpowers/plans/2026-06-11-plan-uiux-sabana.md
git commit -m "docs: add UI/UX implementation plan"
```

---

## Catatan Penyelesaian

Setelah plan ini selesai: aplikasi punya sistem desain Sabana (token + komponen), sidebar collapsible, dan halaman kasir yang dipoles penuh (kartu produk kotak bergambar, grid konfigurabel, toast, dialog). Layar lain (Shift, Stok, Keuangan, Menu) menyusul di putaran berikutnya memakai komponen `components/ui/` yang sama.
