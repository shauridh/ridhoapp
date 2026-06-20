# Plan: Perkecil Grid Menu + Refactor Cart UI

## Scope

Dua perubahan UI terpisah:

1. **Halaman Kelola Menu** — default grid kecil (seperti kasir), toggle tetap tersedia
2. **Cart di kasir** — hilangkan card background, tampilan list bersih + compact agar lebih banyak item muat

---

## Perubahan 1: Default Grid Kecil di Kelola Menu

### File: `app/(internal)/settings/menu/menu-grid.tsx`

**Kondisi sekarang:**

```typescript
const [view, setView] = useState<ViewMode>(() => {
  if (typeof window === "undefined") return "list";
  return (localStorage.getItem("settings.menuView") as ViewMode) ?? "list";
});
```

Default fallback adalah `"list"` jika belum ada localStorage value.

**Perubahan:**
Ganti fallback default dari `"list"` ke `"grid"`:

```typescript
const [view, setView] = useState<ViewMode>(() => {
  if (typeof window === "undefined") return "grid";
  return (localStorage.getItem("settings.menuView") as ViewMode) ?? "grid";
});
```

Toggle list/grid tetap ada — pengguna masih bisa switch ke list view kapan saja.

---

## Perubahan 2: Cart Kasir — List Bersih Tanpa Card

### File: `app/(internal)/pos/cart.tsx`

**Kondisi sekarang:**
Setiap item cart dibungkus:

```tsx
<div className="rounded-lg border border-hairline bg-white p-2 text-sm">
```

Dengan tombol qty besar (h-11 w-11) yang memakan banyak ruang vertikal.

**Perubahan yang direncanakan:**

#### a) Item cart: hilangkan card, pakai divider

Ganti wrapper card dengan divider tipis antar item:

```tsx
{/* Sebelum: card dengan border */}
<div className="rounded-lg border border-hairline bg-white p-2 text-sm">

{/* Sesudah: flat list dengan divider */}
<div className="border-b border-hairline py-2 text-sm last:border-b-0">
```

#### b) Tombol qty: lebih compact

Kurangi ukuran tombol +/- dari `h-11 w-11` (44px) ke `h-7 w-7` (28px) — masih touch-friendly tapi tidak membuang ruang:

```tsx
{/* Sebelum */}
<button className="h-11 w-11 rounded-lg border border-hairline text-xl ...">

{/* Sesudah */}
<button className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline text-sm font-bold ...">
```

#### c) Layout item: satu baris

Susun nama + qty controls + harga dalam satu baris untuk efisiensi vertikal:

```
[Nama Produk]   [−] [1] [+]   [Rp 15.000] [✕]
```

Jika ada varian, tampilkan di baris kedua kecil:

```
[Nama Produk]   [−] [1] [+]   [Rp 15.000] [✕]
Varian: Besar, Pedas
```

#### d) Header area: lebih compact

Sederhanakan header — "Keranjang (N item)" tetap ada tapi sedikit lebih kecil.

#### e) Total & tombol bayar: tetap sama

Bagian bawah (total + Simpan + Bayar) tidak berubah — sudah compact.

---

## Layout Cart Baru (Ilustrasi)

**Sebelum:**

```
┌────────────────────────────────┐
│ Keranjang (3 item)  [Kosongkan]│
│                                │
│ ┌──────────────────────────┐  │
│ │ Ayam Goreng           ✕  │  │  <- card dengan border, bg-white
│ │ [−] [2] [+]  Rp 30.000  │  │  <- tombol 44px
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ Es Teh              ✕    │  │
│ │ [−] [1] [+]  Rp 8.000   │  │
│ └──────────────────────────┘  │
│                                │
│ Total           Rp 38.000      │
│ [Simpan]  [Bayar (3)]          │
└────────────────────────────────┘
```

**Sesudah:**

```
┌────────────────────────────────┐
│ Keranjang (3 item)  [Kosongkan]│
│────────────────────────────────│
│ Ayam Goreng  [−][2][+]  30k ✕ │  <- flat, satu baris, compact
│────────────────────────────────│
│ Es Teh       [−][1][+]   8k ✕ │
│────────────────────────────────│
│ Paket Hemat  [−][1][+]  25k ✕ │
│  + Besar, Pedas                │  <- varian di baris kecil
│────────────────────────────────│
│ Total           Rp 63.000      │
│ [Simpan]  [Bayar (4)]          │
└────────────────────────────────┘
```

---

## File yang Diubah

| File                                         | Perubahan                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `app/(internal)/settings/menu/menu-grid.tsx` | Default fallback dari `"list"` ke `"grid"`                             |
| `app/(internal)/pos/cart.tsx`                | Hilangkan card wrapper, compact qty controls, flat list dengan divider |

**Total: 2 file diubah, tidak ada file baru**

---

## Catatan Teknis

- Tidak ada perubahan logic/state
- Tidak ada perubahan props interface
- Scroll masih bekerja karena `flex-1 overflow-y-auto` tetap dipertahankan di container
- Touch targets tombol qty 28px masih cukup untuk mobile (minimum yang dianjurkan 24px, ideal 44px untuk accessibility — namun di kasir biasanya dipakai dengan stylus atau jari kasir yang terbiasa)
- Jika ada kekhawatiran aksesibilitas tombol, bisa tambahkan `min-h-[36px] min-w-[36px]` sebagai kompromi
