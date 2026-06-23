"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

const PRESETS = [
  { key: "today", label: "Hari Ini" },
  { key: "this_week", label: "Minggu Ini" },
  { key: "this_month", label: "Bulan Ini" },
  { key: "last_month", label: "Bulan Lalu" },
  { key: "this_year", label: "Tahun Ini" },
  { key: "all_time", label: "Semua Waktu" },
];

function todayWib() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

interface Props {
  paramKey: string;
  fromKey: string;
  toKey: string;
  defaultPreset?: string;
}

export function FinanceFilter({ paramKey, fromKey, toKey, defaultPreset = "this_month" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const currentRange = params.get(paramKey) ?? defaultPreset;
  const currentFrom = params.get(fromKey) ?? "";
  const currentTo = params.get(toKey) ?? "";
  const isCustom = !!(currentFrom && currentTo);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"preset" | "custom">(isCustom ? "custom" : "preset");
  const [from, setFrom] = useState(currentFrom || todayWib());
  const [to, setTo] = useState(currentTo || todayWib());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildUrl = (extra: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    p.delete(paramKey);
    p.delete(fromKey);
    p.delete(toKey);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return `/finance?${p.toString()}`;
  };

  const applyPreset = (key: string) => {
    setOpen(false);
    router.push(buildUrl({ [paramKey]: key }));
  };

  const applyCustom = () => {
    if (!from || !to) return;
    const f = from <= to ? from : to;
    const t = from <= to ? to : from;
    setOpen(false);
    router.push(buildUrl({ [fromKey]: f, [toKey]: t }));
  };

  const activePreset = PRESETS.find((p) => p.key === currentRange);
  const buttonLabel = isCustom
    ? `${currentFrom} \u2014 ${currentTo}`
    : (activePreset?.label ?? "Bulan Ini");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition hover:bg-surface"
      >
        <CalendarDays size={13} className="shrink-0 text-brand" />
        {buttonLabel}
        <ChevronDown
          size={11}
          className={`shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-hairline bg-white shadow-xl overflow-hidden">
          <div className="flex border-b border-hairline">
            <button
              onClick={() => setMode("preset")}
              className={`flex-1 py-2 text-xs font-semibold transition ${
                mode === "preset" ? "bg-brand text-white" : "text-ink-soft hover:bg-surface"
              }`}
            >
              Preset
            </button>
            <button
              onClick={() => setMode("custom")}
              className={`flex-1 py-2 text-xs font-semibold transition ${
                mode === "custom" ? "bg-brand text-white" : "text-ink-soft hover:bg-surface"
              }`}
            >
              Tanggal
            </button>
          </div>

          {mode === "preset" && (
            <div className="py-1">
              {PRESETS.map((p) => {
                const active = !isCustom && currentRange === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p.key)}
                    className={`flex w-full items-center px-4 py-2 text-left text-sm transition ${
                      active ? "bg-tint-red text-brand font-semibold" : "hover:bg-surface text-ink"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}

          {mode === "custom" && (
            <div className="p-3 space-y-2">
              <div>
                <label className="mb-1 block text-xs text-ink-soft">Dari</label>
                <input
                  type="date"
                  value={from}
                  max={todayWib()}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink-soft">Sampai</label>
                <input
                  type="date"
                  value={to}
                  min={from}
                  max={todayWib()}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={applyCustom}
                  disabled={!from || !to}
                  className="flex-1 rounded-lg bg-brand py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  Terapkan
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink-soft hover:bg-surface"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
