"use client"

import { useRouter, useSearchParams } from "next/navigation"

const PRESETS = [
  { key: "today", label: "Hari Ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
]

export function RangeSelector() {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get("range") ?? "today"

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => router.push(`/dashboard?range=${p.key}`)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            current === p.key
              ? "bg-brand text-white"
              : "bg-white text-ink-soft hover:bg-surface"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
