# Plan: Nomor Order Harian + Link Delivery + WA Auto Screenshot

## Scope

4 fitur dalam satu batch:

1. **Nomor order reset harian** (`#001`, `#002`, dst) — migration + RPC update
2. **WA auto-send pakai screenshot DOM** (konsisten dengan manual share, hapus Satori flow)
3. **Template struk profesional** — teks tidak terpotong, nomor order di tengah
4. **Link online delivery di Settings > Online** + instruksi setup `NEXT_PUBLIC_APP_URL`

---

## Analisis Kondisi Saat Ini

### Tabel `orders`

Kolom: `id`, `shift_id`, `total`, `payment_method`, `source`, `status`, `void_reason`, `created_by`, `created_at`.
Tidak ada `order_number`.

### `create_order` RPC (0010_pos_transactional_rpc.sql)

Insert:

```sql
insert into public.orders (shift_id, total, payment_method, source, status, created_by)
values (v_shift, p_total, p_payment_method, 'cashier', 'completed', v_uid)
returning * into v_order;
```

Return: full `public.orders` row via `return v_order`.

### WA Auto-Send

`sendReceiptWa` server action generate PNG via Satori + upload Supabase. Masalah:

- Satori fetch font dari Google CDN (lambat, bisa gagal)
- Layout berbeda dengan DOM struk
- Manual share via `html2canvas` sudah berjalan baik

---

## Implementasi Detail

### STEP 1: Migration `0014_order_number_daily.sql`

Dua bagian: (a) tambah kolom, (b) update fungsi `create_order`.

```sql
-- ============================================================
-- PART A: Tambah kolom order_number ke tabel orders
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number integer;

-- Index untuk query nomor order hari ini dengan cepat
CREATE INDEX IF NOT EXISTS idx_orders_date_number
  ON public.orders (date(created_at at time zone 'utc'), order_number);

-- Backfill: isi existing rows berdasar urutan created_at per hari UTC
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY date(created_at at time zone 'utc')
           ORDER BY created_at
         )::integer AS rn
  FROM public.orders
)
UPDATE public.orders o
SET order_number = n.rn
FROM numbered n
WHERE o.id = n.id;

-- ============================================================
-- PART B: Update fungsi create_order — tambah order_number
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_order(
  p_total numeric,
  p_payment_method text,
  p_items jsonb
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_shift uuid;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_variant jsonb;
  v_oi_id uuid;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_recipe uuid;
  v_line record;
  v_qty integer;
  v_product uuid;
  v_next_order_num integer;  -- NEW
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Tidak terautentikasi';
  END IF;
  IF NOT public.is_internal_user() THEN
    RAISE EXCEPTION 'Akses ditolak';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang kosong';
  END IF;

  SELECT id INTO v_shift FROM public.shifts WHERE status = 'open' LIMIT 1;

  -- Hitung nomor order hari ini (reset harian, mulai dari 1)  -- NEW
  SELECT COALESCE(MAX(order_number), 0) + 1
    INTO v_next_order_num
    FROM public.orders
   WHERE date(created_at AT TIME ZONE 'utc') = v_today;

  INSERT INTO public.orders
    (shift_id, total, payment_method, source, status, created_by, order_number)  -- +order_number
  VALUES
    (v_shift, p_total, p_payment_method, 'cashier', 'completed', v_uid, v_next_order_num)  -- +v_next_order_num
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'qty')::int;
    v_product := (v_item->>'productId')::uuid;

    INSERT INTO public.order_items (order_id, product_id, product_name, qty, unit_price, subtotal)
    VALUES (
      v_order.id,
      v_product,
      v_item->>'productName',
      v_qty,
      (v_item->>'unitPrice')::numeric,
      ((v_item->>'unitPrice')::numeric +
        COALESCE((SELECT SUM((v->>'priceDelta')::numeric)
                  FROM jsonb_array_elements(v_item->'variants') v), 0)
      ) * v_qty
    )
    RETURNING id INTO v_oi_id;

    FOR v_variant IN SELECT * FROM jsonb_array_elements(COALESCE(v_item->'variants', '[]'::jsonb))
    LOOP
      INSERT INTO public.order_item_variants (order_item_id, variant_id, variant_name, price_delta)
      VALUES (
        v_oi_id,
        (v_variant->>'variantId')::uuid,
        v_variant->>'variantName',
        (v_variant->>'priceDelta')::numeric
      );
    END LOOP;

    -- Kurangi stok via resep aktif (atomik).
    v_recipe := public._active_recipe_id(v_product, v_today);
    IF v_recipe IS NOT NULL THEN
      FOR v_line IN
        SELECT ingredient_id, qty_used FROM public.recipe_lines WHERE recipe_id = v_recipe
      LOOP
        UPDATE public.ingredients
          SET stock_qty = stock_qty - (v_line.qty_used * v_qty)
          WHERE id = v_line.ingredient_id;

        INSERT INTO public.stock_movements (ingredient_id, change_qty, reason, ref_id, note, created_by)
        VALUES (v_line.ingredient_id, -(v_line.qty_used * v_qty), 'sale', v_order.id,
                'Penjualan ' || v_qty || ' porsi', v_uid);
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_order;
END;
$$;
```

---

### STEP 2: Update `next.config.ts`

Tambah `NEXT_PUBLIC_APP_URL` ke env block:

```typescript
env: {
  NEXT_PUBLIC_APP_NAME: "Sabana POS",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
},
```

---

### STEP 3: Update `.env.local.example`

Tambah baris:

```
# URL publik aplikasi (untuk link pemesanan online pelanggan)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

### STEP 4: Update `pos-client.tsx`

#### 4a. Update `ReceiptState` interface

```typescript
interface ReceiptState {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
  items: { name: string; qty: number; price: number }[];
  paid?: number;
  change?: number;
  order_number?: number; // NEW
  customerPhone?: string; // NEW — untuk auto-trigger WA
}
```

#### 4b. Update `handleCheckout` — hapus server-side `sendReceiptWa`, pass ke receipt

Ganti:

```typescript
// Hapus seluruh blok ini:
if (customerPhone) {
  setWaStatus("sending")
  sendReceiptWa(...).then(...)
} else {
  setWaStatus(null)
}
```

Dengan:

```typescript
// Pass customerPhone ke receipt state untuk auto-send di modal
setReceipt({
  ...result.order,
  paid,
  change,
  items: receiptItems,
  customerPhone: customerPhone || undefined,
});
```

#### 4c. Update `<ReceiptModal>` props

```tsx
<ReceiptModal
  order={receipt}
  items={receipt.items ?? []}
  paid={receipt.paid}
  change={receipt.change}
  showPrint={showPrint}
  storeName={storeName}
  storeAddress={storeAddress}
  storePhone={storePhone}
  orderNumber={receipt.order_number} // NEW
  customerPhone={receipt.customerPhone} // NEW
  onClose={() => setReceipt(null)}
/>
```

Hapus `waStatus` dan `setWaStatus` dari `pos-client.tsx` karena sekarang di-handle di dalam `Receipt` modal.

---

### STEP 5: Rewrite `receipt.tsx`

#### 5a. Interface baru

```typescript
interface Props {
  order: ReceiptOrder;
  items: ReceiptItem[];
  paid?: number;
  change?: number;
  showPrint?: boolean;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  orderNumber?: number; // NEW
  customerPhone?: string; // NEW — auto-trigger WA
  onClose: () => void;
}
```

#### 5b. Auto-send logic via screenshot (useRef + useEffect)

```typescript
const autoSendRef = useRef(false);

useEffect(() => {
  if (customerPhone && !autoSendRef.current && receiptRef.current) {
    autoSendRef.current = true;
    // Delay 500ms agar DOM render sempurna
    const t = setTimeout(() => captureAndSendWa(customerPhone), 500);
    return () => clearTimeout(t);
  }
}, [customerPhone]); // eslint-disable-line react-hooks/exhaustive-deps
```

`captureAndSendWa(phone)` adalah fungsi yang menggunakan `html2canvas` dan POST ke `/api/pos/receipt-screenshot`.

#### 5c. Layout struk profesional

Perubahan kunci:

- Ganti `font-mono` → tidak pakai (default sans-serif)
- Ganti `truncate` → allow wrap (`flex-1`)
- Tambah `tabular-nums` untuk angka
- Separator `<div className="border-t border-dashed border-gray-200 my-2" />`
- Nomor order di tengah: `# 001` di bawah telepon toko
- Hapus karakter `─` diganti border dashed

#### 5d. Tombol bagikan tetap ada (manual)

Tombol "Bagikan" sudah ada untuk share manual, tetap dipertahankan.

#### 5e. WaStatus sekarang dari state internal

Karena auto-send dikelola di dalam `Receipt` sendiri, tidak perlu `waStatus` dari props. Semua status dikelola oleh `shareStatus` state yang sudah ada.

---

### STEP 6: Settings Online — Delivery Link Box

**File:** `app/(internal)/settings/online/online-form.tsx`

Tambah komponen `DeliveryLinkBox` di atas `<form>`:

```tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

function DeliveryLinkBox() {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const orderUrl = appUrl ? `${appUrl}/order` : null;

  if (!orderUrl) {
    return (
      <div className="rounded-2xl bg-tint-amber px-4 py-3">
        <p className="text-sm font-semibold text-ink">Link Pemesanan Online</p>
        <p className="mt-1 text-xs text-ink-soft">
          Tambahkan{" "}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-xs font-bold">
            NEXT_PUBLIC_APP_URL
          </code>{" "}
          ke environment variables deployment (misal:{" "}
          <code className="font-mono text-xs">https://sabana.vercel.app</code>), lalu redeploy. Link
          pemesanan pelanggan akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-tint-blue px-4 py-3">
      <p className="text-sm font-semibold text-info">Link Pemesanan Online</p>
      <p className="mt-0.5 text-xs text-ink-soft">
        Bagikan link ini ke pelanggan untuk pesan secara online.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 break-all rounded-lg bg-white px-3 py-2 text-sm text-ink">
          {orderUrl}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(orderUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-white transition hover:bg-surface"
          title={copied ? "Tersalin!" : "Salin link"}
          aria-label={copied ? "Tersalin!" : "Salin link"}
        >
          {copied ? (
            <Check size={15} className="text-success" />
          ) : (
            <Copy size={15} className="text-ink-soft" />
          )}
        </button>
      </div>
    </div>
  );
}
```

---

## Instruksi Setup `NEXT_PUBLIC_APP_URL`

### Vercel (paling umum)

1. Buka https://vercel.com → pilih project Sabana POS
2. Tab **Settings** → **Environment Variables**
3. Klik **Add New**:
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** URL deployment kamu, contoh `https://sabana-pos.vercel.app`
   - **Environment:** pilih **Production** (centang juga Preview jika perlu)
4. Klik **Save**
5. Klik **Deployments** → pilih deployment terbaru → **Redeploy**

### Local Development

Tambah ke `.env.local`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart dev server.

### VPS / Self-hosted

Set environment variable di server atau `docker-compose.yml`:

```
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Yang Tidak Berubah

- `/api/pos/receipt-screenshot` route — tidak perlu diubah
- `lib/wa/receipt-image.ts` — tidak dihapus (bisa dipakai nanti)
- `pos/actions.ts` — `sendReceiptWa` tetap ada tapi tidak dipanggil dari checkout
- `lib/wa/getsender.ts` — tidak berubah

---

## Urutan Implementasi

| #   | File                                              | Aksi                                           |
| --- | ------------------------------------------------- | ---------------------------------------------- |
| 1   | `supabase/migrations/0014_order_number_daily.sql` | BARU                                           |
| 2   | `.env.local.example`                              | Tambah `NEXT_PUBLIC_APP_URL`                   |
| 3   | `next.config.ts`                                  | Expose env var                                 |
| 4   | `app/(internal)/pos/pos-client.tsx`               | Update ReceiptState + hapus sendReceiptWa call |
| 5   | `app/(internal)/pos/receipt.tsx`                  | Template baru + auto-send screenshot           |
| 6   | `app/(internal)/settings/online/online-form.tsx`  | Tambah DeliveryLinkBox                         |
| 7   | `npm run build`                                   | Verifikasi                                     |
