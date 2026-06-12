"use client"

import { useEffect, useMemo, useState } from "react"
import { GripVertical } from "lucide-react"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Props {
  categories: string[] // urutan default dari server (categories.sort_order)
  active: string | null
  onChange: (c: string | null) => void
}

const STORAGE_KEY = "pos.categoryOrder"

// Strip chip kategori yang bisa di-drag (press & move) untuk reorder.
// Urutan tersimpan per-device di localStorage; tetap konsisten dengan
// kategori dari server kalau ada kategori baru ditambah.
export function CategoryChips({ categories, active, onChange }: Props) {
  const [order, setOrder] = useState<string[]>(categories)
  const [dragging, setDragging] = useState(false)

  // Sinkronkan dengan localStorage + tambahkan kategori baru di akhir.
  useEffect(() => {
    let saved: string[] = []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) saved = JSON.parse(raw)
    } catch {
      saved = []
    }
    const filtered = saved.filter((c) => categories.includes(c))
    const missing = categories.filter((c) => !filtered.includes(c))
    setOrder([...filtered, ...missing])
  }, [categories])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  )

  const ids = useMemo(() => order, [order])

  const handleDragEnd = (e: DragEndEvent) => {
    setDragging(false)
    const { active: a, over } = e
    if (!over || a.id === over.id) return
    setOrder((prev) => {
      const oldIndex = prev.indexOf(String(a.id))
      const newIndex = prev.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) return prev
      const next = arrayMove(prev, oldIndex, newIndex)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // abaikan: localStorage mungkin penuh / dimatikan
      }
      return next
    })
  }

  if (categories.length === 0) return null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => setDragging(true)}
      onDragCancel={() => setDragging(false)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip
          label="Semua"
          active={active === null}
          onClick={() => onChange(null)}
        />
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          {order.map((c) => (
            <SortableChip
              key={c}
              id={c}
              active={active === c}
              onClick={() => onChange(c)}
              dragging={dragging}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-brand text-white"
          : "border border-hairline bg-white text-ink"
      }`}
    >
      {label}
    </button>
  )
}

function SortableChip({
  id,
  active,
  onClick,
  dragging,
}: {
  id: string
  active: boolean
  onClick: () => void
  dragging: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    touchAction: "none" as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-full border transition ${
        active
          ? "border-brand bg-brand text-white"
          : "border-hairline bg-white text-ink"
      } ${isDragging ? "ring-2 ring-brand/40 shadow-lg" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab pl-2 active:cursor-grabbing"
        aria-label="Pindahkan urutan kategori"
      >
        <GripVertical size={14} className={active ? "text-white/80" : "text-ink-soft"} />
      </button>
      <button
        onClick={onClick}
        // Cegah klik saat sedang drag agar tidak ganti filter tak sengaja.
        onPointerUp={(e) => {
          if (dragging) e.preventDefault()
        }}
        className="whitespace-nowrap py-1.5 pr-4 text-sm font-semibold"
      >
        {id}
      </button>
    </div>
  )
}
