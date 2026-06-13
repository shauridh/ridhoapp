import { describe, it, expect } from "vitest";
import { resolveRange, type RangePreset } from "./date-range";

describe("resolveRange", () => {
  const now = new Date("2026-06-12T10:00:00Z");

  it("hari ini: start awal hari, end akhir hari", () => {
    const r = resolveRange("today", now);
    expect(r.start.slice(0, 10)).toBe("2026-06-12");
    expect(r.end.slice(0, 10)).toBe("2026-06-12");
    expect(r.days).toBe(1);
  });

  it("kemarin", () => {
    const r = resolveRange("yesterday", now);
    expect(r.start.slice(0, 10)).toBe("2026-06-11");
    expect(r.end.slice(0, 10)).toBe("2026-06-11");
    expect(r.days).toBe(1);
  });

  it("7 hari mencakup 7 hari termasuk hari ini", () => {
    const r = resolveRange("7d", now);
    expect(r.start.slice(0, 10)).toBe("2026-06-06");
    expect(r.end.slice(0, 10)).toBe("2026-06-12");
    expect(r.days).toBe(7);
  });

  it("30 hari", () => {
    const r = resolveRange("30d", now);
    expect(r.start.slice(0, 10)).toBe("2026-05-14");
    expect(r.end.slice(0, 10)).toBe("2026-06-12");
    expect(r.days).toBe(30);
  });

  it("menyediakan periode sebelumnya yang setara", () => {
    const r = resolveRange("7d", now);
    expect(r.prevStart.slice(0, 10)).toBe("2026-05-30");
    expect(r.prevEnd.slice(0, 10)).toBe("2026-06-05");
  });

  it("default ke today untuk preset tak dikenal", () => {
    const r = resolveRange("xxx" as RangePreset, now);
    expect(r.days).toBe(1);
    expect(r.start.slice(0, 10)).toBe("2026-06-12");
  });
});
