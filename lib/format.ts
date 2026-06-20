/**
 * Format angka ke format mata uang Rupiah.
 * Contoh: 15000 → "Rp 15.000"
 */
export function rupiah(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}
