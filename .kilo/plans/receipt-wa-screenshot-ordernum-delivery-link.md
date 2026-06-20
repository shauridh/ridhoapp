# Plan: Fix WA Auto-Send Screenshot + Order Number + Delivery Link Settings

## Scope

4 perbaikan terpisah:

1. **WA auto-send kirim screenshot** (bukan Satori PNG) — konsisten dengan manual share yang sudah berjalan
2. **Template struk profesional** dengan nomor order (dihitung sekuensial), teks tidak terpotong
3. **Link online delivery di pengaturan** — tambah field di Settings > Online agar bisa disalin/dibagikan
4. **Nomor order sekuensial** — tambah `order_number` ke tabel orders (migration)

---

## Analisis Kondisi Saat Ini

### WA Auto-Send (Masalah)

Saat ini `sendReceiptWa` di `pos/actions.ts`:

1. Generate PNG via `generateReceiptPng()` (Satori + resvg-wasm)
2. Upload ke Supabase Storage
3. Kirim URL via `send-media`
4. Hapus file dari storage

**Problem:** Satori generate PNG di server tanpa font yang sudah di-cache (fetch dari Google CDN setiap cold start), dan layout Satori berbeda dengan tampilan DOM struk. User lebih suka hasil screenshot DOM yang sudah terbukti bekerja.

### Manual Share (Berjalan)

`handleShareWa` di `receipt.tsx`:

1. `html2canvas` screenshot DOM element `receiptRef`
2. POST FormData ke `/api/pos/receipt-screenshot`
3. Route upload blob ke Supabase Storage → kirim WA media → hapus file

**Problem dengan storage:** Tidak perlu menyimpan ke Supabase. Bisa langsung kirim sebagai upload atau via base64.

### Nomor Order

Tabel `orders` tidak punya `order_number`. ID adalah UUID. Perlu tambah kolom sekuensial.

### Delivery Link

`/order` sudah ada sebagai public URL. Perlu cara mudah untuk melihat dan menyalin link ini di settings.

---

## Detail Implementasi

### Fitur 1: WA Auto-Send via Screenshot (Browser-Side)

Pendekatan: **Kirim dari browser, bukan server action**.

Setelah checkout berhasil, modal struk muncul. Kita screenshot DOM struk dan langsung kirim ke WA via `/api/pos/receipt-screenshot` — tanpa perlu Satori/resvg.

#### 1a. Update `pos-client.tsx`

Hilangkan pemanggilan `sendReceiptWa` server action untuk auto-send. Sebagai gantinya, pass `customerPhone` sebagai prop ke `Receipt` modal, lalu biarkan `Receipt` yang handle screenshot + kirim setelah render.

```typescript
// pos-client.tsx — handleCheckout
if (result.ok) {
  setReceipt({
    ...result.order,
    paid,
    change,
    items: receiptItems,
    customerPhone, // NEW: pass nomor HP ke receipt
  });
  setCart(createCart());
  setShowPayment(false);
  // Hapus blok sendReceiptWa — receipt.tsx yang handle
}
```

#### 1b. Update `receipt.tsx`

Tambah prop `customerPhone?: string`. Jika ada, auto-trigger `handleShareWa` setelah render pertama:

```tsx
// receipt.tsx
const [autoSendDone, setAutoSendDone] = useState(false);

useEffect(() => {
  if (customerPhone && !autoSendDone && receiptRef.current) {
    setAutoSendDone(true);
    setSharePhone(customerPhone);
    // Delay sedikit agar DOM render sempurna
    const t = setTimeout(() => {
      handleShareWaWithPhone(customerPhone);
    }, 300);
    return () => clearTimeout(t);
  }
}, [customerPhone, autoSendDone]);
```

`handleShareWaWithPhone(phone)` adalah versi `handleShareWa` yang menerima phone sebagai argument (tidak bergantung state `sharePhone`).

#### 1c. Update `ReceiptState` interface di `pos-client.tsx`

Tambah `customerPhone?: string` ke `ReceiptState`:

```typescript
interface ReceiptState {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
  items: { name: string; qty: number; price: number }[];
  paid?: number;
  change?: number;
  customerPhone?: string; // NEW
  orderNumber?: number; // NEW — untuk tampilan struk
}
```

#### 1d. Hapus Satori dependency dari auto-send flow

`lib/wa/receipt-image.ts` dan `generateReceiptPng` tetap ada (tidak dihapus) karena mungkin berguna ke depannya, tapi tidak lagi dipanggil dari `sendReceiptWa`.

`pos/actions.ts` — simplifikasi `sendReceiptWa` agar hanya kirim teks (fallback saja), karena kirim gambar sekarang di-handle oleh browser.

Atau: hapus `sendReceiptWa` sama sekali dari `pos/actions.ts` — tidak dipanggil lagi.

---

### Fitur 2: Template Struk Profesional + Teks Tidak Terpotong

**File:** `app/(internal)/pos/receipt.tsx`

Masalah layout saat ini:

- `truncate` pada item name memotong teks
- Font `font-mono` kurang terlihat profesional
- Tidak ada nomor order

#### 2a. Layout baru receipt content

Perubahan pada `div.receipt-print`:

```tsx
<div ref={receiptRef} className="receipt-print bg-white p-5 font-sans text-sm text-ink">
  {/* Header */}
  <div className="text-center">
    <div className="text-base font-extrabold uppercase tracking-widest">{storeName}</div>
    {storeAddress && <div className="mt-0.5 text-xs text-ink-soft">{storeAddress}</div>}
    {storePhone && <div className="text-xs text-ink-soft">Tel: {storePhone}</div>}
    {/* Nomor Order di tengah */}
    {orderNumber && (
      <div className="mt-1 text-xs font-bold text-ink">
        # {String(orderNumber).padStart(4, "0")}
      </div>
    )}
  </div>
  <div className="my-2 border-t border-dashed border-gray-300" />
  <div className="mb-2 text-center text-xs text-ink-soft">{formatDate(order.created_at)}</div>
  {/* Items — no truncate, biarkan wrap */}
  <div className="space-y-1">
    {items.map((item, i) => (
      <div key={i} className="flex justify-between gap-2">
        <div className="flex-1">
          {" "}
          {/* wrap alih-alih truncate */}
          <span>{item.name}</span>
          <span className="ml-1 text-ink-soft">×{item.qty}</span>
        </div>
        <span className="shrink-0 tabular-nums">
          Rp {(item.price * item.qty).toLocaleString("id-ID")}
        </span>
      </div>
    ))}
  </div>
  <div className="my-2 border-t border-dashed border-gray-300" />
  {/* Total */}
  <div className="flex justify-between font-bold text-base">
    <span>TOTAL</span>
    <span className="tabular-nums">Rp {order.total.toLocaleString("id-ID")}</span>
  </div>
  {/* Tunai/Kembali */}
  ...
  <div className="my-2 border-t border-dashed border-gray-300" />
  <div className="text-center text-xs text-ink-soft">Terima kasih sudah berbelanja 🙏</div>
</div>
```

Key improvements:

- Hapus `font-mono`, ganti ke `font-sans` (lebih profesional)
- Item name **wrap** bukan **truncate**
- Nomor order (`# 0001`) di tengah bawah telepon toko
- Gunakan `tabular-nums` untuk alignment angka
- Separator dashed border bukan karakter `─`
- Width struk di `receipt-print` CSS: `width: 280px` (mirip 58mm thermal)

#### 2b. Update `globals.css` print section

```css
.receipt-print {
  position: fixed;
  left: 0;
  top: 0;
  width: 280px; /* ~58mm */
  font-size: 9pt;
  line-height: 1.4;
  color: black;
  background: white;
}
```

---

### Fitur 3: Link Online Delivery di Pengaturan

**Goal:** Di Settings > Online, tampilkan URL publik `/order` yang bisa disalin dan dibagikan ke pelanggan.

#### 3a. Update `online/online-form.tsx`

Tambah section "Link Pemesanan Online" di atas form:

```tsx
// Ambil base URL dari window atau env
const orderUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/order`
  : process.env.NEXT_PUBLIC_APP_URL + '/order'

// Render:
<div className="rounded-2xl bg-tint-blue p-4">
  <h3 className="text-sm font-semibold text-info">Link Pemesanan Online</h3>
  <p className="mt-1 text-xs text-ink-soft">
    Bagikan link ini ke pelanggan agar bisa pesan secara online.
  </p>
  <div className="mt-2 flex items-center gap-2">
    <code className="flex-1 rounded-lg bg-white px-3 py-2 text-sm text-ink break-all">
      {orderUrl}
    </code>
    <button onClick={() => navigator.clipboard.writeText(orderUrl)}>
      <Copy size={16} />
    </button>
  </div>
</div>
```

**Tidak perlu menyimpan ke database** — URL sudah diketahui (selalu `/order` relatif ke domain).

#### 3b. Update `online/page.tsx`

Pass `appUrl` ke `OnlineForm` jika env var tersedia, atau biarkan form yang resolve dari `window.location`.

Sebenarnya tidak perlu props — `window.location.origin` di client sudah cukup.

---

### Fitur 4: Nomor Order Sekuensial

#### 4a. Tambah kolom `order_number` ke tabel orders

**File baru:** `supabase/migrations/NNNN_order_number.sql`

```sql
-- Tambah sequence untuk nomor order
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- Tambah kolom order_number ke tabel orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number integer
    NOT NULL DEFAULT nextval('public.order_number_seq');

-- Untuk existing rows, isi dengan nilai sekuensial
DO $$
DECLARE
  r record;
  n integer := 1;
BEGIN
  FOR r IN SELECT id FROM public.orders ORDER BY created_at LOOP
    UPDATE public.orders SET order_number = n WHERE id = r.id;
    n := n + 1;
  END LOOP;
END $$;
```

#### 4b. Update `create_order` RPC

RPC sudah `return v_order` (full row). Setelah migration, `order_number` otomatis terisi via DEFAULT, dan akan ikut ter-return.

Tidak perlu ubah RPC signature — hanya perlu pastikan `ReceiptState` dan `Receipt` props menerima `orderNumber`.

#### 4c. Update type di `pos-client.tsx`

```typescript
interface ReceiptState {
  // existing...
  order_number?: number; // NEW — dari result.order setelah migration
}
```

#### 4d. Pass `orderNumber` ke `Receipt` modal

```tsx
<ReceiptModal
  // existing props...
  orderNumber={receipt.order_number}
/>
```

---

### Fitur 5: `/api/pos/receipt-screenshot` — Tanpa Supabase Storage

Saat ini route upload ke Supabase Storage lalu ambil URL. Ini tidak perlu.

**Pendekatan baru:** Terima PNG blob, konversi ke base64 data URL, kirim ke getsender.id via `url` parameter yang berisi data URL... tapi ini tidak akan bekerja karena getsender.id butuh URL publik.

**Alternatif yang benar:** Pakai Supabase Storage hanya sebagai hosting sementara (sudah dilakukan), tapi path-nya bisa lebih clean. Atau gunakan external image hosting singkat.

**Keputusan:** Tetap pakai Supabase Storage sementara (sudah berjalan), tapi:

1. Gunakan TTL bucket policy jika tersedia
2. Hapus setelah kirim (sudah dilakukan)
3. Tidak ada perubahan untuk ini — sudah optimal

User bilang "struk tidak perlu disimpan di Supabase" — ini bisa diinterpretasikan sebagai: cukup generate PNG dari server (Satori) tanpa menyimpan permanen. Tapi karena getsender.id butuh URL publik, storage tetap diperlukan sebentar.

**Solusi alternatif:** Upload ke server eksternal gratis yang tidak butuh auth, atau gunakan `base64` jika getsender.id support. Perlu cek.

Berdasarkan parameter API getsender.id yang diketahui: hanya ada `url` sebagai parameter gambar, tidak ada `base64`. Jadi storage sementara masih diperlukan.

**Keputusan final:** Tetap pakai storage sementara, tapi pisahkan bucket — buat `receipts` bucket khusus (atau subfolder di `produk-images`). File tetap dihapus setelah kirim.

---

## Pertanyaan untuk User

1. **Nomor order**: Apakah nomor order harus reset setiap hari (mulai dari 001 lagi setiap hari baru) atau terus bertambah selamanya dari order pertama?
2. **Link delivery**: Apakah ada custom domain/URL yang dipakai, atau cukup generate otomatis dari `window.location.origin`?
3. **Format nomor order di struk**: Apakah cukup angka saja (`#123`) atau perlu format tanggal (`20260619-001`)?

---

## Urutan Implementasi

| #   | File                                             | Aksi                                                                |
| --- | ------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | `supabase/migrations/NNNN_order_number.sql`      | BARU: tambah kolom + sequence                                       |
| 2   | `app/(internal)/pos/pos-client.tsx`              | Update ReceiptState + pass customerPhone + orderNumber ke Receipt   |
| 3   | `app/(internal)/pos/receipt.tsx`                 | Template profesional + auto-send via screenshot + nomor order       |
| 4   | `app/(internal)/pos/actions.ts`                  | Simplifikasi sendReceiptWa (hapus Satori flow, cukup teks fallback) |
| 5   | `app/(internal)/settings/online/online-form.tsx` | Tambah section link pemesanan online                                |
| 6   | `app/(internal)/settings/online/page.tsx`        | Minimal update (tidak perlu props baru)                             |
| 7   | Build & test                                     | `npm run build`                                                     |

**Total: 5 file diupdate, 1 file baru (migration)**
