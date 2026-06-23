import { describe, it, expect } from "vitest";
import { resolveRange, resolveCustomRange, type RangePreset } from "./date-range";

describe("resolveRange", () => {
  const now = new Date("2026-06-23T06:00:00Z"); // 23 Jun 2026 13:00 WIB = Selasa

  it("hari ini: start awal hari, end akhir hari, vs kemarin", () => {
    const r = resolveRange("today", now);
    expect(r.start.slice(0, 10)).toBe("2026-06-23");
    expect(r.end.slice(0, 10)).toBe("2026-06-23");
    expect(r.prevStart.slice(0, 10)).toBe("2026-06-22");
    expect(r.days).toBe(1);
  });

  it("minggu ini: Senin s/d hari ini, vs minggu lalu", () => {
    // 2026-06-23 = Selasa → Senin = 2026-06-22
    const r = resolveRange("this_week", now);
    expect(r.start.slice(0, 10)).toBe("2026-06-22");
    expect(r.end.slice(0, 10)).toBe("2026-06-23");
    expect(r.prevStart.slice(0, 10)).toBe("2026-06-15");
    expect(r.prevEnd.slice(0, 10)).toBe("2026-06-21");
    expect(r.days).toBe(2);
  });

  it("bulan ini: tgl 1 s/d hari ini, vs bulan lalu", () => {
    const r = resolveRange("this_month", now);
    expect(r.start.slice(0, 10)).toBe("2026-06-01");
    expect(r.end.slice(0, 10)).toBe("2026-06-23");
    expect(r.prevStart.slice(0, 10)).toBe("2026-05-01");
    expect(r.prevEnd.slice(0, 10)).toBe("2026-05-31");
  });

  it("tahun ini: 1 Jan s/d hari ini, vs tahun lalu", () => {
    const r = resolveRange("this_year", now);
    expect(r.start.slice(0, 10)).toBe("2026-01-01");
    expect(r.end.slice(0, 10)).toBe("2026-06-23");
    expect(r.prevStart.slice(0, 10)).toBe("2025-01-01");
    expect(r.prevEnd.slice(0, 10)).toBe("2025-12-31");
  });

  it("all time: mulai dari 2020", () => {
    const r = resolveRange("all_time", now);
    expect(r.start.slice(0, 10)).toBe("2020-01-01");
    expect(r.end.slice(0, 10)).toBe("2026-06-23");
  });

  it("custom range: hitung hari dan periode sebelumnya", () => {
    const r = resolveCustomRange("2026-06-01", "2026-06-07");
    expect(r.start.slice(0, 10)).toBe("2026-06-01");
    expect(r.end.slice(0, 10)).toBe("2026-06-07");
    expect(r.days).toBe(7);
    expect(r.prevStart.slice(0, 10)).toBe("2026-05-25");
    expect(r.prevEnd.slice(0, 10)).toBe("2026-05-31");
  });

  it("default ke today untuk preset tak dikenal", () => {
    const r = resolveRange("xxx" as RangePreset, now);
    expect(r.days).toBe(1);
    expect(r.start.slice(0, 10)).toBe("2026-06-23");
  });
});
