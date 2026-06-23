import { toWibDateString, startOfWibDay, endOfWibDay, addDaysWib } from "@/lib/utils/wib";

export type RangePreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "all_time";

export interface ResolvedRange {
  start: string; // ISO
  end: string; // ISO
  prevStart: string;
  prevEnd: string;
  days: number;
  label?: string;
}

/** Resolve dari custom date string YYYY-MM-DD */
export function resolveCustomRange(from: string, to: string): ResolvedRange {
  const msPerDay = 86400000;
  const fromMs = new Date(`${from}T00:00:00+07:00`).getTime();
  const toMs = new Date(`${to}T00:00:00+07:00`).getTime();
  const days = Math.max(1, Math.round((toMs - fromMs) / msPerDay) + 1);
  const prevEnd = addDaysWib(from, -1);
  const prevStart = addDaysWib(prevEnd, -(days - 1));
  return {
    start: startOfWibDay(from),
    end: endOfWibDay(to),
    prevStart: startOfWibDay(prevStart),
    prevEnd: endOfWibDay(prevEnd),
    days,
  };
}

// Terjemahkan preset rentang menjadi tanggal ISO start/end + periode sebelumnya.
export function resolveRange(preset: RangePreset, now: Date = new Date()): ResolvedRange {
  const todayWib = toWibDateString(now);

  // Senin minggu ini
  const nowWib = new Date(now.getTime() + 7 * 3600000);
  const dow = nowWib.getUTCDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const thisMonday = addDaysWib(todayWib, -daysFromMonday);
  const lastMonday = addDaysWib(thisMonday, -7);
  const lastSunday = addDaysWib(thisMonday, -1);

  // Bulan & tahun ini
  const [year, month] = todayWib.split("-").map(Number);
  const firstOfMonth = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const firstOfLastMonth = new Date(Date.UTC(year, month - 2, 1));
  const firstOfLastMonthStr = toWibDateString(firstOfLastMonth).slice(0, 7) + "-01";
  const lastDayOfLastMonth = addDaysWib(firstOfMonth, -1);

  const firstOfYear = `${year}-01-01`;
  const firstOfLastYear = `${year - 1}-01-01`;
  const lastDayOfLastYear = `${year - 1}-12-31`;

  switch (preset) {
    case "this_week": {
      const weekDays = daysFromMonday + 1;
      return {
        start: startOfWibDay(thisMonday),
        end: endOfWibDay(todayWib),
        prevStart: startOfWibDay(lastMonday),
        prevEnd: endOfWibDay(lastSunday),
        days: weekDays,
        label: "Minggu Ini",
      };
    }
    case "this_month": {
      const msPerDay = 86400000;
      const startMs = new Date(`${firstOfMonth}T00:00:00+07:00`).getTime();
      const endMs = new Date(`${todayWib}T00:00:00+07:00`).getTime();
      const days = Math.max(1, Math.round((endMs - startMs) / msPerDay) + 1);
      return {
        start: startOfWibDay(firstOfMonth),
        end: endOfWibDay(todayWib),
        prevStart: startOfWibDay(firstOfLastMonthStr),
        prevEnd: endOfWibDay(lastDayOfLastMonth),
        days,
        label: "Bulan Ini",
      };
    }
    case "last_month": {
      const lastMonthDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
      return {
        start: startOfWibDay(firstOfLastMonthStr),
        end: endOfWibDay(lastDayOfLastMonth),
        prevStart: startOfWibDay(addDaysWib(firstOfLastMonthStr, -lastMonthDays)),
        prevEnd: endOfWibDay(addDaysWib(firstOfLastMonthStr, -1)),
        days: lastMonthDays,
        label: "Bulan Lalu",
      };
    }
    case "this_year": {
      const msPerDay = 86400000;
      const startMs = new Date(`${firstOfYear}T00:00:00+07:00`).getTime();
      const endMs = new Date(`${todayWib}T00:00:00+07:00`).getTime();
      const days = Math.max(1, Math.round((endMs - startMs) / msPerDay) + 1);
      return {
        start: startOfWibDay(firstOfYear),
        end: endOfWibDay(todayWib),
        prevStart: startOfWibDay(firstOfLastYear),
        prevEnd: endOfWibDay(lastDayOfLastYear),
        days,
        label: `Tahun ${year}`,
      };
    }
    case "all_time": {
      // Periode sebelumnya tidak relevan untuk all time
      return {
        start: "2020-01-01T00:00:00+07:00",
        end: endOfWibDay(todayWib),
        prevStart: "2020-01-01T00:00:00+07:00",
        prevEnd: endOfWibDay(todayWib),
        days: 9999,
        label: "Semua Waktu",
      };
    }
    case "today":
    default: {
      const yesterday = addDaysWib(todayWib, -1);
      return {
        start: startOfWibDay(todayWib),
        end: endOfWibDay(todayWib),
        prevStart: startOfWibDay(yesterday),
        prevEnd: endOfWibDay(yesterday),
        days: 1,
        label: "Hari Ini",
      };
    }
  }
}
