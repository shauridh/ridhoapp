"use client"

import { useEffect, useState } from "react"
import type { GridSetting } from "@/lib/domain/grid"
import { useToast } from "@/components/ui/toast"

const COL_OPTIONS: GridSetting[] = ["auto", 3, 4, 5]

// Preferensi tampilan kasir disimpan per-perangkat (localStorage),
// karena tablet kasir & HP owner bisa beda kebutuhan.
export function CashierDisplaySettings() {
  const [cols, setCols] = useState<GridSetting>("auto")
  const [showSearch, setShowSearch] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const savedCols = localStorage.getItem("pos.gridCols")
    if (savedCols === "3" || savedCols === "4" || savedCols === "5") {
      setCols(Number(savedCols) as GridSetting)
    } else {
      setCols("auto")
    }
    setShowSearch(localStorage.getItem("pos.showSearch") === "true")
    setShowPrint(localStorage.getItem("pos.showPrint") === "true")
    setLoaded(true)
  }, [])

  const changeCols = (c: GridSetting) => {
    setCols(c)
    localStorage.setItem("pos.gridCols", String(c))
    toast.show("Tersimpan di perangkat ini", "success")
  }

  const toggleSearch = (v: boolean) => {
    setShowSearch(v)
    localStorage.setItem("pos.showSearch", v ? "true" : "false")
    toast.show("Tersimpan di perangkat ini", "success")
  }

  const togglePrint = (v: boolean) => {
    setShowPrint(v)
    localStorage.setItem("pos.showPrint", v ? "true" : "false")
    toast.show("Tersimpan di perangkat ini", "success")
  }

  if (!loaded) return null

  return (
    <div className="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-semibold text-ink">Tampilan Kasir</h2>
        <p className="text-xs text-ink-faint">
          Pengaturan ini hanya berlaku di perangkat ini.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Jumlah Kolom Produk
        </label>
        <div className="flex gap-2">
          {COL_OPTIONS.map((o) => (
            <button
              key={String(o)}
              onClick={() => changeCols(o)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                cols === o
                  ? "bg-brand text-white"
                  : "border border-hairline bg-white text-ink"
              }`}
            >
              {o === "auto" ? "Auto" : `${o} kolom`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="show_search"
          checked={showSearch}
          onChange={(e) => toggleSearch(e.target.checked)}
          className="h-5 w-5 rounded accent-brand"
        />
        <label htmlFor="show_search" className="text-sm font-medium text-ink">
          Tampilkan kotak pencarian di kasir
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="show_print"
          checked={showPrint}
          onChange={(e) => togglePrint(e.target.checked)}
          className="h-5 w-5 rounded accent-brand"
        />
        <label htmlFor="show_print" className="text-sm font-medium text-ink">
          Tampilkan tombol cetak struk
        </label>
      </div>
    </div>
  )
}
