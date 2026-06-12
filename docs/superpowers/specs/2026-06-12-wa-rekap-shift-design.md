# WA Rekap Shift - Desain

Tanggal: 2026-06-12

## Tujuan

Saat kasir menutup shift, rekap penjualan otomatis dikirim ke WhatsApp owner via
gateway getsender.id. Best-effort: kegagalan kirim WA tidak menggagalkan tutup shift.

## Arsitektur (3 layer)

### 1. `lib/wa/getsender.ts` - gateway client

```ts
sendWa(number: string, message: string): Promise<{ ok: boolean; error?: string }>
```

- Baca `WA_API_KEY` dan `WA_SENDER` dari `process.env`.
- POST ke `https://seen.getsender.id/send-message` dengan param
  `api_key`, `sender`, `number`, `message`, `footer`.
- Timeout pendek (8 detik) via `AbortController`.
- Tidak melempar error; selalu return objek `{ ok, error? }`.
- Tidak ada referensi ke shift (reusable).

### 2. `lib/domain/shift-report.ts` - formatter (pure, TDD)

```ts
interface ShiftReportData {
  storeName: string
  closedAt: string        // ISO
  omzet: number
  transaksi: number
  item: number
  tunai: number
  qris: number
  kasAwal: number
  kasAkhir: number
  selisih: number
  topSellers: { name: string; qty: number }[]
}

formatShiftReport(data: ShiftReportData): string
```

Output (teks WA):

```
*REKAP SHIFT - Sabana Fried Chicken*
12 Jun 2026, 10:29

Omzet      : Rp 1.250.000
Transaksi  : 48
Item       : 132

-- Pembayaran --
Tunai      : Rp 800.000
QRIS       : Rp 450.000

-- Kas Laci --
Kas Awal   : Rp 200.000
Kas Akhir  : Rp 300.000
Selisih    : Rp 0  (cocok)

-- Terlaris --
1. Paket Ayam x40
2. Nasi x32
```

Aturan format:
- Angka rupiah pakai pemisah ribuan `id-ID`.
- Selisih: `0` -> tanda cocok; `>0` -> "lebih"; `<0` -> "kurang".
- Top sellers kosong -> baris "Belum ada penjualan".

### 3. Integrasi di `closeShift` (`app/(internal)/pos/shift/actions.ts`)

Setelah shift sukses di-update:
1. Ambil `order_items` shift -> hitung `topSellers` (limit 5) + total item.
2. Ambil `owner_wa` dan `wa_report_enabled` dari `app_settings`.
3. Jika `wa_report_enabled === "true"` dan `owner_wa` ada:
   - `formatShiftReport(...)` -> `sendWa(owner_wa, msg)` dibungkus try/catch.
4. Kegagalan WA hanya di-log (best-effort), tetap return `{ ok: true }`.

## Konfigurasi

`.env.local` (rahasia, tidak masuk git):
```
WA_API_KEY=...
WA_SENDER=62881080557887
```

`app_settings` (lewat halaman Pengaturan):
- `owner_wa` - nomor WA owner (format 62...)
- `wa_report_enabled` - "true" / "false"

## Testing

TDD untuk `formatShiftReport`:
- format angka rupiah benar
- selisih = 0 (cocok), > 0 (lebih), < 0 (kurang)
- top sellers terisi dan kosong

Layer WA tidak di-unit-test (I/O jaringan), cukup dibungkus try/catch.

## Out of scope

- Tidak ada AI / analisa saran.
- Tidak ada multi-nomor penerima.
- Tidak ada penjadwalan terpisah (hanya saat tutup shift).
