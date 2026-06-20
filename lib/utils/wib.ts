/**
 * Utilitas timezone Asia/Jakarta (WIB, GMT+7).
 * Semua fungsi menghasilkan string tanggal/waktu yang benar untuk WIB,
 * terlepas dari timezone server/browser.
 */

const TZ = "Asia/Jakarta";

/** Kembalikan string "YYYY-MM-DD" dalam WIB untuk Date yang diberikan. */
export function toWibDateString(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // en-CA → YYYY-MM-DD
}

/** Kembalikan jam (0-23) dalam WIB untuk Date yang diberikan. */
export function toWibHour(d: Date): number {
  return Number(d.toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false })) % 24;
}

/** Awal hari WIB (00:00:00 WIB) dalam ISO string untuk filter DB. */
export function startOfWibDay(dateStr: string): string {
  // dateStr format YYYY-MM-DD
  return `${dateStr}T00:00:00+07:00`;
}

/** Akhir hari WIB (23:59:59 WIB) dalam ISO string untuk filter DB. */
export function endOfWibDay(dateStr: string): string {
  return `${dateStr}T23:59:59+07:00`;
}

/** Tambah/kurang hari dari string YYYY-MM-DD, kembalikan YYYY-MM-DD. */
export function addDaysWib(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  d.setDate(d.getDate() + n);
  return toWibDateString(d);
}
