import { toWibDateString, startOfWibDay, endOfWibDay, addDaysWib } from "@/lib/utils/wib";

export type RangePreset = "today" | "yesterday" | "7d" | "30d" | "this_month";

export interface ResolvedRange {
  start: string; // ISO
  end: string; // ISO
  prevStart: string;
  prevEnd: string;
  days: number;
}

// Terjemahkan preset rentang menjadi tanggal ISO start/end + periode sebelumnya.
// Semua kalkulasi dalam timezone Asia/Jakarta (WIB, GMT+7).
export function resolveRange(preset: RangePreset, now: Date = new Date()): ResolvedRange {
  const todayWib = toWibDateString(now);
  let days = 1;
  let endDay = todayWib;

  switch (preset) {
    case "yesterday":
      endDay = addDaysWib(todayWib, -1);
      days = 1;
      break;
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "this_month": {
      const [year, month] = todayWib.split("-").map(Number);
      const firstOfMonth = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
      // hitung jumlah hari dari awal bulan sampai hari ini
      const msPerDay = 86400000;
      const start = new Date(`${firstOfMonth}T00:00:00+07:00`).getTime();
      const end = new Date(`${todayWib}T00:00:00+07:00`).getTime();
      days = Math.max(1, Math.round((end - start) / msPerDay) + 1);
      const prevEnd = addDaysWib(firstOfMonth, -1);
      const prevStart = addDaysWib(prevEnd, -(days - 1));
      return {
        start: startOfWibDay(firstOfMonth),
        end: endOfWibDay(todayWib),
        prevStart: startOfWibDay(prevStart),
        prevEnd: endOfWibDay(prevEnd),
        days,
      };
    }
    case "today":
    default:
      days = 1;
      break;
  }

  const startDay = addDaysWib(endDay, -(days - 1));
  const prevEndDay = addDaysWib(startDay, -1);
  const prevStartDay = addDaysWib(prevEndDay, -(days - 1));

  return {
    start: startOfWibDay(startDay),
    end: endOfWibDay(endDay),
    prevStart: startOfWibDay(prevStartDay),
    prevEnd: endOfWibDay(prevEndDay),
    days,
  };
}
