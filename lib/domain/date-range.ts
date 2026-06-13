export type RangePreset = "today" | "yesterday" | "7d" | "30d" | "this_month";

export interface ResolvedRange {
  start: string; // ISO
  end: string; // ISO
  prevStart: string;
  prevEnd: string;
  days: number;
}

function startOfDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function endOfDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

// Terjemahkan preset rentang menjadi tanggal ISO start/end + periode sebelumnya.
export function resolveRange(preset: RangePreset, now: Date = new Date()): ResolvedRange {
  let days = 1;
  let endDay = startOfDayUtc(now);

  switch (preset) {
    case "yesterday":
      endDay = addDays(startOfDayUtc(now), -1);
      days = 1;
      break;
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "this_month": {
      const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const today = startOfDayUtc(now);
      days = Math.max(1, Math.round((today.getTime() - firstOfMonth.getTime()) / 86400000) + 1);
      endDay = today;
      const startDayResult = firstOfMonth;
      const prevEndDay = addDays(startDayResult, -1);
      const prevStartDay = addDays(prevEndDay, -(days - 1));
      return {
        start: startOfDayUtc(startDayResult).toISOString(),
        end: endOfDayUtc(endDay).toISOString(),
        prevStart: startOfDayUtc(prevStartDay).toISOString(),
        prevEnd: endOfDayUtc(prevEndDay).toISOString(),
        days,
      };
    }
    case "today":
    default:
      days = 1;
      break;
  }

  const startDay = addDays(endDay, -(days - 1));
  const prevEndDay = addDays(startDay, -1);
  const prevStartDay = addDays(prevEndDay, -(days - 1));

  return {
    start: startOfDayUtc(startDay).toISOString(),
    end: endOfDayUtc(endDay).toISOString(),
    prevStart: startOfDayUtc(prevStartDay).toISOString(),
    prevEnd: endOfDayUtc(prevEndDay).toISOString(),
    days,
  };
}
