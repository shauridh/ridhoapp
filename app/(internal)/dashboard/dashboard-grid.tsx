"use client"

import { useState, useTransition } from "react"
import GridLayout, { type Layout } from "react-grid-layout"
import { useRef, useEffect } from "react"
import { Settings2, Plus, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { WidgetRenderer, type WidgetData } from "./widget-renderer"
import { addWidget, deleteWidget, saveLayout } from "./widget-actions"
import { METRICS, type ChartType, type WidgetRow } from "@/lib/domain/dashboard-widgets"

interface Props {
  widgets: WidgetRow[]
  data: WidgetData
}

const CHART_LABELS: Record<ChartType, string> = {
  stat: "Kartu Statistik",
  line: "Garis (Line)",
  bar: "Batang (Bar)",
  donut: "Donat (Donut)",
  radar: "Radar",
  rank: "Peringkat (Bar Horizontal)",
}

export function DashboardGrid({ widgets, data }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [width, setWidth] = useState(1200)
  const containerRef = useRef<HTMLDivElement>(null)
  const [, startTransition] = useTransition()
  const toast = useToast()

  // form tambah widget
  const [newTitle, setNewTitle] = useState("")
  const [newMetric, setNewMetric] = useState<string>("omzet")
  const [newChart, setNewChart] = useState<ChartType>("stat")

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const layout: Layout[] = widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: 2,
    minH: 2,
  }))

  const handleLayoutChange = (next: Layout[]) => {
    if (!editMode) return
    startTransition(async () => {
      await saveLayout(
        next.map((l) => ({ id: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
      )
    })
  }

  const availableCharts = METRICS[newMetric]?.kinds ?? ["stat"]
  // pastikan chart yang dipilih valid untuk metrik
  if (!availableCharts.includes(newChart)) {
    setNewChart(availableCharts[0])
  }

  const handleAdd = () => {
    startTransition(async () => {
      const result = await addWidget({
        title: newTitle || METRICS[newMetric].label,
        chartType: newChart,
        metric: newMetric,
      })
      if (result.ok) {
        toast.show("Widget ditambahkan", "success")
        setShowAdd(false)
        setNewTitle("")
      } else {
        toast.show(result.error, "error")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteWidget(id)
      if (result.ok) toast.show("Widget dihapus", "success")
      else toast.show(result.error, "error")
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Dashboard</h1>
        <div className="flex items-center gap-2">
          {editMode && (
            <Button variant="secondary" icon={Plus} onClick={() => setShowAdd(true)}>
              Tambah Widget
            </Button>
          )}
          <Button
            variant={editMode ? "primary" : "ghost"}
            icon={editMode ? Check : Settings2}
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? "Selesai" : "Atur"}
          </Button>
        </div>
      </div>

      {editMode && (
        <p className="rounded-xl bg-tint-amber px-4 py-2 text-sm text-ink">
          Mode atur aktif. Seret untuk pindah, tarik pojok kanan-bawah untuk ubah
          ukuran. Perubahan tersimpan otomatis.
        </p>
      )}

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hairline bg-white py-16 text-center">
          <p className="font-medium text-ink">Dashboard masih kosong</p>
          <p className="text-sm text-ink-soft">
            Klik &quot;Atur&quot; lalu &quot;Tambah Widget&quot; untuk mulai.
          </p>
          <Button
            variant="primary"
            icon={Settings2}
            onClick={() => setEditMode(true)}
          >
            Mulai Atur
          </Button>
        </div>
      ) : (
        <div ref={containerRef}>
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={48}
            width={width}
            isDraggable={editMode}
            isResizable={editMode}
            onLayoutChange={handleLayoutChange}
            compactType="vertical"
            margin={[12, 12]}
          >
            {widgets.map((w) => (
              <div key={w.id} className="relative">
                {editMode && (
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white shadow"
                    aria-label="Hapus widget"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="h-full w-full">
                  <WidgetRenderer
                    metric={w.metric}
                    chartType={w.chart_type}
                    title={w.title}
                    data={data}
                  />
                </div>
              </div>
            ))}
          </GridLayout>
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Tambah Widget"
        size="md"
      >
        <div className="space-y-3">
          <Select
            label="Data yang ditampilkan"
            value={newMetric}
            onChange={(e) => setNewMetric(e.target.value)}
          >
            {Object.entries(METRICS).map(([key, m]) => (
              <option key={key} value={key}>
                {m.label}
              </option>
            ))}
          </Select>
          <Select
            label="Jenis grafik"
            value={newChart}
            onChange={(e) => setNewChart(e.target.value as ChartType)}
          >
            {availableCharts.map((c) => (
              <option key={c} value={c}>
                {CHART_LABELS[c]}
              </option>
            ))}
          </Select>
          <Input
            label="Judul (opsional)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={METRICS[newMetric]?.label}
          />
          <div className="flex gap-2 pt-2">
            <Button variant="primary" onClick={handleAdd} className="flex-1">
              Tambah
            </Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              Batal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
