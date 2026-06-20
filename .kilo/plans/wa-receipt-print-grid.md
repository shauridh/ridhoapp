# Plan: Kirim Struk WA + Print Struk Thermal + Grid Produk Settings

## Scope

Tiga fitur yang saling berkaitan:

1. **Kirim struk via WhatsApp** setelah pembayaran berhasil
2. **Print struk thermal** (58mm default, compatible Bluetooth portable printer)
3. **Grid produk di Settings > Menu** bisa toggle ke tampilan small (seperti di kasir)

---

## Keputusan dari User

- Nama toko: **ambil dari `app_settings` key `store_name`**
- Ukuran struk default: **58mm**
- Footer struk: **tambah alamat & no. telp toko** (perlu key baru di `app_settings`)

---

## Analisis Kondisi Saat Ini

### app_settings yang sudah ada

Key yang relevan:

- `store_name` — sudah ada, dikelola di Settings > Toko
- `ongkir`, `qris_image`, `qris_string`, `online_enabled`, `owner_wa`, `wa_report_enabled`, `wa_template`

**Key yang perlu ditambah:** `store_address`, `store_phone`

### Receipt (`app/(internal)/pos/receipt.tsx`)

- Modal dengan `.receipt-print` div
- `window.print()` langsung tanpa custom page size
- Nama toko hardcoded `"Sabana Fried Chicken"`
- Tidak ada WA integration

### WhatsApp (`lib/wa/getsender.ts`)

- `sendWa(number, message)` sudah ada — server-side
- Butuh nomor HP pelanggan untuk kirim

### PaymentModal (`app/(internal)/pos/payment-modal.tsx`)

- Tidak ada input nomor HP pelanggan

### Settings > Toko (`app/(internal)/settings/toko/`)

- `toko-form.tsx` hanya ada field `store_name` dan `ongkir`
- `app-settings-actions.ts` punya `upsertKeys()` yang reusable

### Settings > Menu (`app/(internal)/settings/menu/page.tsx`)

- Server Component, grid hardcoded `sm:grid-cols-2 xl:grid-cols-3`
- Tidak ada toggle tampilan

### lib/domain/grid.ts

- `GridSetting = "auto" | 3 | 4 | 5`
- `gridStyle(setting)` — sudah ada, bisa direuse

---

## Rencana Implementasi Detail

### Step 1: Tambah `store_address` & `store_phone` ke Settings Toko

#### 1a. Update `saveTokoSettings` di `app-settings-actions.ts`

Tambah dua key baru ke fungsi yang sudah ada:

```typescript
export async function saveTokoSettings(formData: FormData) {
  return upsertKeys([
    { key: "store_name", value: ... },
    { key: "ongkir", value: ... },
    { key: "store_address", value: String(formData.get("store_address") ?? "").trim() },
    { key: "store_phone", value: String(formData.get("store_phone") ?? "").trim() },
  ])
}
```

#### 1b. Update `toko/page.tsx`

Tambah `store_address` dan `store_phone` ke query `.in("key", [...])`:

```typescript
.in("key", ["store_name", "ongkir", "store_address", "store_phone"])
```

Pass ke `<TokoForm storeName=... ongkir=... storeAddress=... storePhone=... />`

#### 1c. Update `toko-form.tsx`

Tambah dua Input field baru:

- `store_address` — label "Alamat Toko", optional
- `store_phone` — label "Nomor Telepon Toko", optional

---

### Step 2: Format Pesan Struk untuk WA

**File baru:** `lib/wa/format-receipt.ts`

Fungsi pure (tidak ada side effect, mudah ditest):

```typescript
interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  orderId: string;
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
  paid?: number;
  change?: number;
}

export function formatReceiptMessage(data: ReceiptData): string;
```

Output format (plain text, WA-friendly dengan bold via `*`):

```
*SABANA FRIED CHICKEN*
Jl. Contoh No. 1, Jakarta
Telp: 0812-3456-7890
──────────────────────
Nama Item x1     15.000
Nama Item x2     30.000
──────────────────────
*TOTAL: Rp 45.000*
Tunai  : Rp 50.000
Kembali: Rp 5.000
Metode : CASH
Tgl    : 19 Jun 2026 14:30
──────────────────────
Terima kasih! 🙏
```

---

### Step 3: Server Action `sendReceiptWa`

**File:** `app/(internal)/pos/actions.ts` — tambah fungsi baru

```typescript
export async function sendReceiptWa(
  phone: string,
  receiptData: {
    orderId: string;
    createdAt: string;
    items: { name: string; qty: number; price: number }[];
    total: number;
    paymentMethod: string;
    paid?: number;
    change?: number;
  }
): Promise<{ ok: boolean; error?: string }> {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tidak terautentikasi" };

  // 2. Fetch store settings dari app_settings
  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["store_name", "store_address", "store_phone"]);
  const settings = new Map((rows ?? []).map((r) => [r.key, r.value]));

  // 3. Format pesan
  const message = formatReceiptMessage({
    storeName: settings.get("store_name") ?? "Sabana POS",
    storeAddress: settings.get("store_address"),
    storePhone: settings.get("store_phone"),
    ...receiptData,
  });

  // 4. Normalize nomor HP: 08xx → 628xx
  const normalized = phone.replace(/^0/, "62");

  // 5. Kirim via WA gateway
  return sendWa(normalized, message);
}
```

---

### Step 4: Update PaymentModal — Tambah Input Nomor HP

**File:** `app/(internal)/pos/payment-modal.tsx`

- Tambah state `customerPhone: string`
- Tambah input field opsional di bawah tombol metode bayar:
  - Label: "No. WA Pelanggan (opsional)"
  - Placeholder: `08xxxxxxxxxx`
  - Type: `tel`
- Update interface `Props.onConfirm` untuk pass `customerPhone`:

```typescript
onConfirm: (method: "cash" | "qris", paid: number, change: number, customerPhone?: string) => void
```

- Di `handleConfirm`, pass `customerPhone || undefined`

---

### Step 5: Update Receipt Component — Thermal Layout + WA Status

**File:** `app/(internal)/pos/receipt.tsx`

#### Perubahan:

1. **Tambah props:**

   ```typescript
   interface Props {
     order: ReceiptOrder;
     items: ReceiptItem[];
     paid?: number;
     change?: number;
     showPrint?: boolean;
     storeName?: string; // NEW: dari app_settings
     storeAddress?: string; // NEW
     storePhone?: string; // NEW
     waStatus?: "sending" | "sent" | "failed" | null; // NEW
     onClose: () => void;
   }
   ```

2. **Ukuran struk toggle** (58mm / 80mm):
   - State `receiptWidth: "58" | "80"` — persisted ke `localStorage("pos.receiptWidth")`
   - Toggle button di action row (ikon ukuran)

3. **Handle print dengan dynamic page size:**

   ```typescript
   const handlePrint = () => {
     const style = document.createElement("style");
     style.id = "receipt-page-size";
     style.textContent = `@page { size: ${receiptWidth}mm auto; margin: 2mm; }`;
     document.head.appendChild(style);
     window.print();
     setTimeout(() => document.getElementById("receipt-page-size")?.remove(), 500);
   };
   ```

4. **Thermal layout di `.receipt-print`:**
   - Gunakan `font-mono text-xs` untuk alignment
   - Nama toko dari prop `storeName` (fallback ke hardcoded)
   - Tampilkan `storeAddress` dan `storePhone` jika ada
   - Separator pakai `<div>` dengan dashes bukan `<hr>`
   - Item layout dengan flex justify-between

5. **WA status indicator** di atas tombol:

   ```tsx
   {
     waStatus === "sending" && (
       <p className="text-center text-sm text-ink-soft">Mengirim struk ke WA...</p>
     );
   }
   {
     waStatus === "sent" && (
       <p className="text-center text-sm text-success">✓ Struk terkirim ke WA</p>
     );
   }
   {
     waStatus === "failed" && <p className="text-center text-sm text-danger">✗ Gagal kirim WA</p>;
   }
   ```

6. Tambah `no-print` class ke semua tombol action

---

### Step 6: Update globals.css — Thermal Print CSS

**File:** `app/globals.css`

Ganti blok `@media print` yang ada:

```css
@media print {
  body * {
    visibility: hidden;
  }
  .receipt-print,
  .receipt-print * {
    visibility: visible;
  }
  .receipt-print {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    font-family: monospace;
    font-size: 10pt;
    line-height: 1.4;
    color: black;
    background: white;
  }
  .no-print {
    display: none !important;
  }
}
```

Note: `@page` size di-inject secara dinamis via JS sebelum `window.print()` (lihat Step 5.3) agar bisa toggle 58mm/80mm tanpa reload.

---

### Step 7: Update pos-client.tsx — Sambungkan WA Flow

**File:** `app/(internal)/pos/pos-client.tsx`

#### Perubahan:

1. **Tambah state `waStatus`:**

   ```typescript
   const [waStatus, setWaStatus] = useState<"sending" | "sent" | "failed" | null>(null);
   ```

2. **Fetch store settings** saat mount (atau pass dari server via props):
   - Opsi: tambah props ke `PosClient` → `storeName`, `storeAddress`, `storePhone`
   - Di `pos/page.tsx`, fetch dari `app_settings` bersamaan dengan `qrisRow`

3. **Update `handleCheckout`** menerima `customerPhone?: string`:

   ```typescript
   const handleCheckout = async (
     method: "cash" | "qris",
     paid: number,
     change: number,
     customerPhone?: string,
   ) => {
     // ... checkout logic ...
     if (result.ok) {
       // Set receipt state
       setReceipt({ ... })
       setCart(createCart())
       setShowPayment(false)

       // Kirim WA jika ada nomor
       if (customerPhone) {
         setWaStatus("sending")
         const waResult = await sendReceiptWa(customerPhone, {
           orderId: result.order.id,
           createdAt: result.order.created_at,
           items: cart.map(...),
           total: cartTotal(cart),
           paymentMethod: method,
           paid,
           change,
         })
         setWaStatus(waResult.ok ? "sent" : "failed")
       }
     }
   }
   ```

4. **Pass `storeName`, `storeAddress`, `storePhone`, `waStatus` ke `<ReceiptModal>`**

5. **Update `pos/page.tsx`** — fetch store settings:

   ```typescript
   const { data: settingsRows } = await supabase
     .from("app_settings")
     .select("key, value")
     .in("key", ["store_name", "store_address", "store_phone", "qris_image"])
   const settingsMap = new Map((settingsRows ?? []).map(r => [r.key, r.value]))

   return (
     <PosClient
       shiftId={openShift.id}
       openingBalance={Number(openShift.opening_balance)}
       qrisImageUrl={settingsMap.get("qris_image") || undefined}
       storeName={settingsMap.get("store_name") || "Sabana POS"}
       storeAddress={settingsMap.get("store_address") || undefined}
       storePhone={settingsMap.get("store_phone") || undefined}
     />
   )
   ```

---

### Step 8: Grid Toggle di Settings > Menu

#### 8a. Buat `MenuGrid` client component baru

**File baru:** `app/(internal)/settings/menu/menu-grid.tsx`

```tsx
"use client";

import { useState } from "react";
import { List, LayoutGrid } from "lucide-react";
import type { ProductRow } from "@/lib/data/products";
import type { CategoryRow } from "@/lib/data/categories";
import { gridStyle } from "@/lib/domain/grid";
import { Card, Badge, ProductRowActions } from "./...";

interface Props {
  products: ProductRow[];
  categories: CategoryRow[];
}

type ViewMode = "list" | "grid";

export function MenuGrid({ products, categories }: Props) {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "list";
    return (localStorage.getItem("settings.menuView") as ViewMode) ?? "list";
  });

  const handleViewChange = (v: ViewMode) => {
    setView(v);
    localStorage.setItem("settings.menuView", v);
  };

  // ... render
}
```

**Dua mode tampilan:**

**List view** (default) — Card besar seperti sekarang:

```tsx
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
  {products.map((p) => (
    <Card> ... detail lengkap (nama, kategori, badge, harga, actions) ... </Card>
  ))}
</div>
```

**Grid view** (small, mirip kasir) — Card kecil:

```tsx
<div className="grid gap-3" style={gridStyle("auto")}>
  {products.map((p) => (
    <div className="relative overflow-hidden rounded-2xl border ...">
      <div className="aspect-square bg-surface">{/* gambar atau emoji */}</div>
      <div className="p-2 text-center">
        <div className="text-sm font-bold text-ink">{p.name}</div>
        <div className="text-sm font-bold text-brand">
          Rp {p.base_price.toLocaleString("id-ID")}
        </div>
      </div>
      {/* ProductRowActions sebagai absolute overlay atau dropdown kecil */}
    </div>
  ))}
</div>
```

**Toggle UI** di atas grid:

```tsx
<div className="flex items-center justify-between mb-2">
  <p className="text-sm text-ink-soft">{products.length} produk</p>
  <div className="flex gap-1 rounded-lg border border-hairline p-1 bg-white">
    <button
      onClick={() => handleViewChange("list")}
      title="Tampilan daftar"
      className={view === "list" ? "...active" : "...inactive"}
    >
      <List size={16} />
    </button>
    <button
      onClick={() => handleViewChange("grid")}
      title="Tampilan grid kecil"
      className={view === "grid" ? "...active" : "...inactive"}
    >
      <LayoutGrid size={16} />
    </button>
  </div>
</div>
```

#### 8b. Update `settings/menu/page.tsx`

Extract bagian grid ke `<MenuGrid>`:

```tsx
import { MenuGrid } from "./menu-grid"

export default async function MenuPage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()])

  return (
    <div className="space-y-4">
      <PageHeader ... />
      {products.length === 0 ? (
        <Card>... empty state ...</Card>
      ) : (
        <MenuGrid products={products} categories={categories} />
      )}
    </div>
  )
}
```

---

## Urutan Implementasi

| #   | File                                              | Aksi   | Alasan urutan                                               |
| --- | ------------------------------------------------- | ------ | ----------------------------------------------------------- |
| 1   | `lib/wa/format-receipt.ts`                        | BARU   | Pure function, tidak ada dependency                         |
| 2   | `app/globals.css`                                 | UPDATE | CSS thermal print                                           |
| 3   | `app/(internal)/settings/app-settings-actions.ts` | UPDATE | Tambah `store_address`, `store_phone` ke `saveTokoSettings` |
| 4   | `app/(internal)/settings/toko/page.tsx`           | UPDATE | Fetch keys baru                                             |
| 5   | `app/(internal)/settings/toko/toko-form.tsx`      | UPDATE | Tambah field alamat & telepon                               |
| 6   | `app/(internal)/pos/actions.ts`                   | UPDATE | Tambah `sendReceiptWa` action                               |
| 7   | `app/(internal)/pos/payment-modal.tsx`            | UPDATE | Input no. HP pelanggan                                      |
| 8   | `app/(internal)/pos/receipt.tsx`                  | UPDATE | Thermal layout, print size toggle, WA status, store info    |
| 9   | `app/(internal)/pos/page.tsx`                     | UPDATE | Fetch store settings, pass ke PosClient                     |
| 10  | `app/(internal)/pos/pos-client.tsx`               | UPDATE | WA flow + store props + waStatus                            |
| 11  | `app/(internal)/settings/menu/menu-grid.tsx`      | BARU   | Client component grid toggle                                |
| 12  | `app/(internal)/settings/menu/page.tsx`           | UPDATE | Gunakan MenuGrid                                            |

**Total: 10 file diupdate, 2 file baru**

---

## Catatan Teknis Penting

### Print ke Bluetooth Printer

Browser `window.print()` mengirim ke printer default sistem. Agar bisa ke Bluetooth portable printer:

- User perlu pairing printer Bluetooth di OS terlebih dahulu
- Set printer sebagai default, atau pilih saat dialog print muncul
- `@page { size: 58mm auto; }` akan direspect oleh driver printer thermal
- Tidak perlu library tambahan — browser print sudah cukup untuk thermal

### Normalisasi Nomor HP

Input user bisa berbagai format → normalize sebelum kirim:

- `08xxxxxxxxxx` → `628xxxxxxxxxx`
- `628xxxxxxxxxx` → tetap
- `+628xxxxxxxxxx` → hapus `+`

### WA Bersifat Non-Blocking

Kirim WA **setelah** `setCart(createCart())` dan receipt sudah ditampilkan. Kalau WA gagal, transaksi tetap berhasil. `waStatus` hanya untuk feedback di receipt modal.

### GridSetting untuk MenuGrid

`gridStyle("auto")` pakai `minmax(140px, 1fr)` — sama persis dengan tampilan kasir POS. Tidak perlu GridSetting selector (cukup toggle list/grid).
