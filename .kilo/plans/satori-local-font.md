# Plan: Satori dengan Font Lokal (Tanpa CDN)

## Goal

Ganti pengambilan font NotoSans dari Google CDN (runtime fetch, tidak reliable) ke file lokal di `public/fonts/`. Generate PNG struk di server via Satori sepenuhnya tanpa dependency jaringan. Hapus `html2canvas` dari flow pengiriman WA.

---

## Font yang Akan Digunakan

Dari Google Fonts API, URL **latin subset** woff2 yang valid:

- **Regular (400):** `https://fonts.gstatic.com/s/notosans/v42/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2`
- **Bold (700):** `https://fonts.gstatic.com/s/notosans/v42/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2`

Catatan: Satori membutuhkan format `woff` atau `truetype` (bukan `woff2`). Karena file woff2 tidak bisa langsung dipakai Satori, gunakan format **woff** dengan URL yang berbeda, atau gunakan alternatif font yang sudah ada di node_modules.

**Solusi terbaik:** Gunakan font dari package `@fontsource/noto-sans` yang sudah bundle font sebagai file lokal, atau download file `.ttf` dari Google Fonts.

Alternatif lebih simpel: Gunakan font bawaan yang ada di sistem atau cari font yang sudah tersedia di node_modules.

**Final decision:** Download file `.ttf` NotoSans langsung dari Google Fonts repository (tersedia di GitHub) dan simpan di `public/fonts/`. Satori mendukung TTF.

### Font URLs (TTF dari noto-sans package di npm)

Gunakan `@fontsource/noto-sans` yang sudah bundle TTF:

```bash
npm install @fontsource/noto-sans
```

File TTF tersedia di:

- `node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff2`
- `node_modules/@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff2`

Sayangnya ini woff2 juga. Satori butuh `ArrayBuffer` dari file font, dan mendukung `woff`, `ttf`, `otf`.

**Solusi final yang paling simpel:** Install `@fontsource/noto-sans` lalu baca file woff2-nya. Satori v0.10+ **mendukung woff2** secara native.

---

## Implementasi

### Step 1: Install `@fontsource/noto-sans`

```bash
npm install @fontsource/noto-sans
```

Package ini bundle semua file font lokal tanpa perlu CDN.

### Step 2: Update `lib/wa/receipt-image.ts`

Ganti `getFont()` dan `getBoldFont()` dari fetch CDN ke `fs.readFile` dari node_modules:

```typescript
import { readFile } from "fs/promises";
import { join } from "path";

async function getFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;
  const path = join(
    process.cwd(),
    "node_modules/@fontsource/noto-sans/files",
    "noto-sans-latin-400-normal.woff2"
  );
  const buf = await readFile(path);
  fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return fontData;
}

async function getBoldFont(): Promise<ArrayBuffer> {
  if (boldFontData) return boldFontData;
  const path = join(
    process.cwd(),
    "node_modules/@fontsource/noto-sans/files",
    "noto-sans-latin-700-normal.woff2"
  );
  const buf = await readFile(path);
  boldFontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return boldFontData;
}
```

### Step 3: Verifikasi nama file yang tepat di @fontsource/noto-sans

Setelah install, cek file yang tersedia:

```bash
Get-ChildItem node_modules/@fontsource/noto-sans/files | Where-Object { $_.Name -match 'latin.*normal' }
```

Kemungkinan nama file:

- `noto-sans-latin-400-normal.woff2`
- `noto-sans-400-latin.woff2`

Sesuaikan path di kode berdasarkan nama file aktual.

### Step 4: Update `pos/actions.ts` — Hapus Satori fallback ke teks

`sendReceiptWa` saat ini punya dua path:

1. Satori PNG → upload → kirim gambar
2. Fallback: teks biasa

Setelah font lokal berjalan, Satori tidak akan gagal lagi (tidak ada CDN dependency). Pertahankan fallback teks sebagai safety net tetapi kita tidak perlu mengubah logic — cukup pastikan path 1 berjalan.

### Step 5: Simplifikasi `receipt.tsx` — Hapus html2canvas dari auto-send

Karena auto-send sekarang handled oleh server action (Satori), hapus `captureAndSendWa` dari `useEffect` auto-send. Pertahankan `captureAndSendWa` hanya untuk tombol **Bagikan** manual (dimana user klik tombol sendiri).

Perubahan di `receipt.tsx`:

```typescript
// HAPUS: auto-send useEffect
// useEffect(() => {
//   if (!customerPhone || autoSendRef.current) return
//   ...
// }, [customerPhone, captureAndSendWa])

// HAPUS: prop customerPhone dari interface (tidak dipakai lagi untuk auto-send)
// Atau pertahankan untuk backward compat tapi tidak dipakai
```

Dan di `pos-client.tsx`, `sendReceiptWa` server action sudah dipanggil langsung — ini yang akan handle auto-send dengan Satori.

### Step 6: Tambah `receiptFooter` ke `sendReceiptWa` payload

`sendReceiptWa` di `actions.ts` saat ini tidak terima `receiptFooter`. Perlu tambah ke `SendReceiptPayload` dan pass ke `generateReceiptPng`.

Update `SendReceiptPayload`:

```typescript
interface SendReceiptPayload {
  // ...existing...
  receiptFooter?: string; // NEW
}
```

Update `generateReceiptPng` call:

```typescript
const pngBuffer = await generateReceiptPng({
  storeName: storeNameResolved,
  storeAddress: storeAddress || undefined,
  storePhone: storePhone || undefined,
  receiptFooter: receiptData.receiptFooter || undefined, // NEW
  ...receiptFields,
});
```

Update `ReceiptImageData` interface di `receipt-image.ts`:

```typescript
interface ReceiptImageData {
  // ...existing...
  receiptFooter?: string; // NEW
}
```

Update Satori tree footer:

```typescript
el(
  "div",
  { textAlign: "center", fontSize: 12, color: "#6B7280" },
  data.receiptFooter || "Selamat menikmati!"
);
```

Update `pos-client.tsx` call ke `sendReceiptWa`:

```typescript
sendReceiptWa(customerPhone, {
  // ...existing fields...
  receiptFooter, // NEW — dari props PosClient
}).catch(() => {});
```

---

## File yang Diubah

| File                                | Perubahan                                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `package.json`                      | Install `@fontsource/noto-sans`                                                                                |
| `lib/wa/receipt-image.ts`           | Ganti font fetch CDN → fs.readFile lokal; tambah `receiptFooter` ke interface & tree                           |
| `app/(internal)/pos/actions.ts`     | Tambah `receiptFooter` ke `SendReceiptPayload` + pass ke `generateReceiptPng`                                  |
| `app/(internal)/pos/pos-client.tsx` | Pass `receiptFooter` ke `sendReceiptWa` call                                                                   |
| `app/(internal)/pos/receipt.tsx`    | Hapus auto-send useEffect (pakai server action saja); pertahankan captureAndSendWa untuk tombol Bagikan manual |

**Total: 5 file diubah, 0 file baru**

---

## Catatan

- Tidak perlu `public/fonts/` — baca langsung dari `node_modules/@fontsource/noto-sans/files/`
- Font-cache tetap in-memory per process — masih ada cold-start delay tapi tidak ada network request
- Satori v0.10 support woff2 native, jadi tidak perlu konversi format
- `html2canvas` tetap ada di package.json tapi hanya dipakai untuk tombol Bagikan manual (tidak di auto-send)
- Delay penghapusan file dari Supabase Storage tetap 10 detik untuk keamanan
