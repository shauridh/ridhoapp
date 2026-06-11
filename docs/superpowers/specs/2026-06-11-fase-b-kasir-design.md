# Fase B: Kasir Lengkap - Design Spec

Tanggal: 2026-06-11
Status: Disetujui (user mempercayakan keputusan ke rekomendasi default)
Scope: PaymentModal (tunai dengan quick-nominal + hitung kembalian, QRIS konfirmasi manual) + struk cetak. Memakai sistem varian yang sudah ada (tidak menambah addon global).

## Keputusan (default rekomendasi)

- Tidak menambah sistem addon global. Varian per produk yang sudah ada sudah cukup untuk extra nasi/sambal/saus.
- Pembayaran: tunai (input nominal bayar, quick-nominal buttons, hitung kembalian) + QRIS (konfirmasi manual, dianggap pas).
- Struk: bisa dicetak via `window.print()` dengan CSS print, plus tombol tutup.

## Alur

1. Kasir isi cart -> klik "Bayar" (mengganti tombol Tunai/QRIS langsung dengan satu tombol Bayar yang membuka PaymentModal).
2. PaymentModal: pilih metode. Jika Tunai -> input uang diterima (quick nominal: pas, 50rb, 100rb, dst) -> tampil kembalian. Jika QRIS -> tampilkan total, konfirmasi diterima.
3. Konfirmasi -> panggil `checkout()` server action yang sudah ada (tidak berubah) dengan paymentMethod terpilih.
4. Sukses -> tampilkan struk (Receipt) dengan rincian + kembalian, toast sukses.

## Domain logic baru (lib/domain/payment.ts) - TDD

- `calcChange(total, paid)`: kembalian = max(0, paid - total).
- `quickNominals(total)`: daftar saran nominal cepat (pas + pembulatan ke atas 50rb/100rb yang relevan), unik & terurut.
- `isPaymentSufficient(total, paid)`: paid >= total.

## Komponen

- `app/(internal)/pos/payment-modal.tsx` (client): modal pilih metode + input tunai + quick nominal + kembalian; pakai komponen Button/Modal/IconButton + ikon lucide.
- `app/(internal)/pos/receipt.tsx` (upgrade): styling Sabana, dukung `paid` & `change` opsional, tombol Cetak (window.print) + Tutup, area struk diberi class `print-area`.
- `app/(internal)/pos/cart.tsx` (upgrade): ganti dua tombol Tunai/QRIS jadi satu tombol "Bayar" yang memanggil `onPay()`.
- `app/(internal)/pos/page.tsx` (upgrade): kelola state PaymentModal; setelah konfirmasi panggil checkout; teruskan paid/change ke Receipt.
- `app/globals.css`: tambah `@media print` agar hanya area struk tercetak.

## Testing

- Unit test `payment.ts` (calcChange, quickNominals, isPaymentSufficient).
- `npm run build` + `npm test` hijau.

## Non-goals

- Addon global, split payment, kembalian non-tunai. QRIS tetap manual (Fase G menambah QRIS dinamis).
