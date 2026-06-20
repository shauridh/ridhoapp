# Plan: Struk Gambar WA + Fix Payment UI + Shift Minimum Kas

## Scope

5 perbaikan dalam satu batch:

1. **Struk WA sebagai gambar** menggunakan `satori` + `@resvg-js/resvg-wasm` → upload ke Supabase Storage `produk-images` → kirim URL via `send-media` endpoint getsender.id
2. **Hapus `footer` dari WA text sender** (sudah dikerjakan sebagian di getsender.ts, perlu verifikasi)
3. **Fix WA gagal kirim** — hapus `footer` param yang menyebabkan rejection
4. **Validasi minimum kas 350rb** sebelum tutup shift (server action + UI warning)
5. **Payment modal UI** — kembalian highlight besar tengah + tombol panah input +1000
6. **Cart harga format normal** `Rp 30.000` (bukan `30k`)

---

## Analisis Saat Ini

### WA Gateway

- Endpoint kirim teks: `POST https://seen.getsender.id/send-message` dengan `{api_key, sender, number, message}`
- **Endpoint kirim gambar:** `POST https://seen.getsender.id/send-media` dengan `{api_key, sender, number, media_type, caption, url}` ← parameter `url` adalah URL gambar publik
- `footer` param menyebabkan rejection — sudah dihapus di getsender.ts (fix sebelumnya)

### Supabase Storage

- Bucket `produk-images` sudah ada, `public: true`
- Upload via `supabase.storage.from('produk-images').upload(path, file)`
- Public URL via `supabase.storage.from('produk-images').getPublicUrl(path)`
- Allowed types: `image/jpeg, image/png, image/webp, image/gif` — perlu tambahkan `image/png`

### Library yang perlu diinstall

- `satori` — generate SVG dari JSX (no browser needed)
- `@resvg-js/resvg-wasm` — convert SVG → PNG buffer (WebAssembly, works in Node.js)

---

## Rencana Detail

### Fitur 1: Struk Gambar WA

#### 1a. Install dependencies

```bash
npm install satori @resvg-js/resvg-wasm
```

#### 1b. Buat komponen struk untuk Satori

**File baru:** `lib/wa/receipt-image.ts`

Satori butuh JSX/React element tapi dirender di server (bukan browser). Gunakan `satori` dengan font bawaan sistem atau Google Font (bisa pakai font data).

Layout struk gambar (58mm = 219px wide, auto height):

```tsx
// lib/wa/receipt-image.ts
import satori from "satori";
import { initWasm, Resvg } from "@resvg-js/resvg-wasm";

// Satori membutuhkan font data — gunakan font NotoSans atau sistem
// Bisa fetch dari Google Fonts atau bundle via assets

export interface ReceiptImageData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
  paid?: number;
  change?: number;
}

export async function generateReceiptImage(data: ReceiptImageData): Promise<Buffer> {
  // 1. Fetch font (NotoSans, cached)
  // 2. Buat SVG via satori dengan JSX element struk
  // 3. Convert SVG ke PNG via resvg-wasm
  // Return: Buffer (PNG)
}
```

**Layout visual struk gambar:**

- Width: 384px (ekuivalen 58mm di 167dpi — standar thermal print preview)
- Background: putih
- Font: monospace atau NotoSans Regular + Bold
- Header: nama toko bold, alamat, telepon
- Separator: garis dashed
- Item list: nama + qty kiri, harga kanan
- Separator
- Total bold besar
- Tunai/Kembali jika cash
- Metode + tanggal
- Footer: "Terima kasih!"

#### 1c. Upload gambar ke Supabase Storage

**File:** `app/(internal)/pos/actions.ts` — update `sendReceiptWa`

Flow:

1. Generate PNG buffer via `generateReceiptImage()`
2. Upload ke `produk-images` bucket dengan path `receipts/${orderId}.png`
3. Get public URL
4. Call `sendWaMedia(phone, url, caption)` bukan `sendWa(phone, message)`
5. Setelah terkirim, hapus file dari storage (opsional — atau biarkan TTL)

#### 1d. Tambah fungsi `sendWaMedia` di getsender.ts

```typescript
export async function sendWaMedia(
  number: string,
  imageUrl: string,
  caption?: string
): Promise<{ ok: boolean; error?: string }>;
```

POST ke `https://seen.getsender.id/send-media` dengan:

```
api_key, sender, number, media_type=image, url=imageUrl, caption
```

---

### Fitur 2: Fix WA Footer (sudah dikerjakan)

`lib/wa/getsender.ts` — `footer` param sudah dihapus di sesi sebelumnya. Perlu verifikasi file sudah benar.

---

### Fitur 3: Validasi Minimum Kas 350rb Saat Tutup Shift

**Konstanta:** `MIN_DRAWER_BALANCE = 350_000` (Rp 350.000)

#### 3a. Server Action — `app/(internal)/pos/shift/actions.ts`

Tambah validasi di `closeShift` sebelum memanggil RPC:

```typescript
export async function closeShift(payload: {
  shiftId: string;
  countedCash: number;
  ownerWithdrawal: number;
}) {
  // ...
  const MIN_DRAWER = 350_000;
  const closingBalance = payload.countedCash - payload.ownerWithdrawal;
  if (closingBalance < MIN_DRAWER) {
    return {
      ok: false as const,
      error: `Kas dalam laci setelah penarikan harus minimal Rp 350.000. Saat ini: Rp ${closingBalance.toLocaleString("id-ID")}`,
    };
  }
  // lanjut ke RPC...
}
```

#### 3b. UI Warning — `app/(internal)/pos/shift-panel.tsx`

Tampilkan warning real-time di form tutup shift:

- Hitung `closingBalance = Number(counted) - Number(withdrawal)` saat user mengetik
- Jika `closingBalance < 350000` → tampilkan warning merah di bawah field "Uang Diambil Owner"
- Tombol "Tutup Shift" disable jika `closingBalance < 350000`

```tsx
const closingBalance = Number(counted || 0) - Number(withdrawal || 0);
const belowMinimum = closingBalance < 350_000;

// Warning:
{
  belowMinimum && counted && (
    <div className="rounded-lg bg-tint-red px-3 py-2 text-sm text-danger">
      Kas dalam laci akan menjadi Rp {closingBalance.toLocaleString("id-ID")}. Minimum yang harus
      tersisa adalah Rp 350.000.
    </div>
  );
}

// Disable button:
<Button type="submit" disabled={pending || belowMinimum}>
  Tutup Shift
</Button>;
```

---

### Fitur 4: Payment Modal — Kembalian Highlight + Input +1000

**File:** `app/(internal)/pos/payment-modal.tsx`

#### 4a. Kembalian — posisi tengah, besar, highlighted

Ganti tampilan kembalian dari row kecil menjadi display besar di tengah:

```tsx
{
  /* Sebelum: */
}
<div className="flex justify-between rounded-lg bg-surface px-3 py-2">
  <span className="text-ink-soft">Kembalian</span>
  <span className="font-bold text-ink">Rp {change.toLocaleString("id-ID")}</span>
</div>;

{
  /* Sesudah: */
}
<div className="rounded-xl bg-tint-green px-4 py-3 text-center">
  <div className="text-xs font-medium text-success">Kembalian</div>
  <div className="text-3xl font-bold text-success">Rp {change.toLocaleString("id-ID")}</div>
</div>;
```

Hanya tampil jika `cashOk && change >= 0`.

#### 4b. Input "Uang diterima" — tombol panah +1000 / -1000

Ganti `<input type="number">` dengan custom input yang punya tombol ▲▼:

```tsx
<div className="flex gap-1">
  <button
    type="button"
    onClick={() => setPaid(Math.max(0, paid - 1000))}
    className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline text-ink-soft hover:bg-surface"
    aria-label="Kurangi 1.000"
  >
    ▼
  </button>
  <input
    type="number"
    value={paid || ""}
    onChange={(e) => setPaid(Number(e.target.value))}
    className="flex-1 rounded-lg border ..."
    placeholder="0"
  />
  <button
    type="button"
    onClick={() => setPaid(paid + 1000)}
    className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline text-ink-soft hover:bg-surface"
    aria-label="Tambah 1.000"
  >
    ▲
  </button>
</div>
```

Note: `type="number"` input spinner browser juga sudah melakukan ±1, tapi kita ganti dengan tombol custom yang eksplisit +1000 dan lebih mudah dipencet.

---

### Fitur 5: Cart Harga Format Normal

**File:** `app/(internal)/pos/cart.tsx`

Ganti format `30k` kembali ke `Rp 30.000`:

```tsx
{
  /* Sebelum: */
}
{
  lineTotal >= 1000
    ? `${(lineTotal / 1000).toLocaleString("id-ID")}k`
    : `${lineTotal.toLocaleString("id-ID")}`;
}

{
  /* Sesudah: */
}
{
  `Rp ${lineTotal.toLocaleString("id-ID")}`;
}
```

Untuk tetap hemat ruang, bisa pertimbangkan memindahkan harga ke baris kedua jika nama produk panjang — tapi ini bisa dilakukan sekaligus.

---

## Urutan Implementasi

| #   | File                                   | Aksi                                                          |
| --- | -------------------------------------- | ------------------------------------------------------------- |
| 1   | `package.json`                         | Install `satori` + `@resvg-js/resvg-wasm`                     |
| 2   | `lib/wa/getsender.ts`                  | Tambah `sendWaMedia()`, pastikan `footer` sudah dihapus       |
| 3   | `lib/wa/receipt-image.ts`              | BARU — generate PNG struk via satori                          |
| 4   | `app/(internal)/pos/actions.ts`        | Update `sendReceiptWa` → generate image → upload → send media |
| 5   | `app/(internal)/pos/shift/actions.ts`  | Tambah validasi minimum 350rb                                 |
| 6   | `app/(internal)/pos/shift-panel.tsx`   | UI warning minimum kas + disable button                       |
| 7   | `app/(internal)/pos/payment-modal.tsx` | Kembalian highlight besar + tombol ±1000                      |
| 8   | `app/(internal)/pos/cart.tsx`          | Format harga normal `Rp 30.000`                               |
| 9   | Build & test                           | `npm run build`                                               |

---

## Catatan Teknis

### Satori + WASM

- Satori bekerja di Node.js runtime tanpa browser
- `@resvg-js/resvg-wasm` butuh inisialisasi WASM sekali (`await initWasm()`), bisa dilakukan dengan singleton pattern
- Font perlu disediakan sebagai `ArrayBuffer` — bisa fetch dari CDN Google Fonts saat pertama kali dipakai, atau bundle sebagai file statis
- Rekomendasi font: `Noto Sans` atau `Plus Jakarta Sans` (sudah dipakai di app)

### Upload ke Storage

- Path: `receipts/${orderId}-${Date.now()}.png`
- File tidak perlu disimpan selamanya — bisa hapus setelah terkirim atau biarkan (kecil, ~30-50KB)
- MIME type `image/png` perlu ditambahkan ke allowed_mime_types bucket jika belum ada (saat ini hanya `jpeg, png, webp, gif` — PNG sudah ada ✓)

### Fallback

Jika generate/upload gambar gagal, fallback otomatis ke kirim teks biasa (behavior sebelumnya). Kasir tidak perlu tahu detail error — receipt tetap muncul dengan WA status.

### Minimum Kas

- Konstanta `350_000` didefinisikan di server action (single source of truth)
- UI warning menghitung live dari input user agar feedback instan
- Server action tetap memvalidasi sebagai guard terakhir

---

## File Baru / Diubah

| File                                   | Status                              |
| -------------------------------------- | ----------------------------------- |
| `lib/wa/getsender.ts`                  | UPDATE (tambah sendWaMedia)         |
| `lib/wa/receipt-image.ts`              | BARU                                |
| `app/(internal)/pos/actions.ts`        | UPDATE (sendReceiptWa → image flow) |
| `app/(internal)/pos/shift/actions.ts`  | UPDATE (validasi 350rb)             |
| `app/(internal)/pos/shift-panel.tsx`   | UPDATE (UI warning)                 |
| `app/(internal)/pos/payment-modal.tsx` | UPDATE (kembalian + ±1000)          |
| `app/(internal)/pos/cart.tsx`          | UPDATE (format harga)               |

**Total: 6 file diupdate, 1 file baru**
