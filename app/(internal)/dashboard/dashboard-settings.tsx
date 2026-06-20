"use client";

import { useState, useEffect } from "react";
import { GripVertical, Eye, EyeOff, RotateCcw, Pencil, Check, X } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  loadDashboardConfig,
  saveDashboardConfig,
  getDefaultTitle,
  type WidgetConfig,
} from "@/lib/domain/dashboard-config";
import { useToast } from "@/components/ui/toast";

export function DashboardSettings() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWidgets(loadDashboardConfig());

    setLoaded(true);
  }, []);

  const save = (next: WidgetConfig[]) => {
    setWidgets(next);
    saveDashboardConfig(next);
    toast.show("Tersimpan di perangkat ini", "success");
  };

  const toggleVisible = (id: string) => {
    const next = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    save(next);
  };

  const startEdit = (w: WidgetConfig) => {
    setEditingId(w.id);
    setEditTitle(w.title);
  };

  const confirmEdit = (id: string) => {
    const title = editTitle.trim();
    if (!title) return;
    const next = widgets.map((w) => (w.id === id ? { ...w, title } : w));
    save(next);
    setEditingId(null);
  };

  const resetTitle = (id: string) => {
    const defaultTitle = getDefaultTitle(id as WidgetConfig["id"]);
    const next = widgets.map((w) => (w.id === id ? { ...w, title: defaultTitle } : w));
    save(next);
    setEditingId(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(widgets, oldIndex, newIndex);
    save(next);
  };

  const resetAll = () => {
    saveDashboardConfig([]);
    setWidgets(loadDashboardConfig());
    toast.show("Reset ke default", "success");
  };

  if (!loaded) return null;

  return (
    <div className="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-ink">Widget Dashboard</h2>
          <p className="text-xs text-ink-faint">
            Atur urutan, nama, dan visibilitas chart. Disimpan di perangkat ini.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1.5 text-xs text-ink-soft transition hover:bg-surface"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline">
            {widgets.map((w) => (
              <SortableWidgetRow
                key={w.id}
                widget={w}
                isEditing={editingId === w.id}
                editTitle={editTitle}
                onEditTitle={setEditTitle}
                onToggle={() => toggleVisible(w.id)}
                onStartEdit={() => startEdit(w)}
                onConfirmEdit={() => confirmEdit(w.id)}
                onCancelEdit={() => setEditingId(null)}
                onResetTitle={() => resetTitle(w.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableWidgetRow({
  widget,
  isEditing,
  editTitle,
  onEditTitle,
  onToggle,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onResetTitle,
}: {
  widget: WidgetConfig;
  isEditing: boolean;
  editTitle: string;
  onEditTitle: (v: string) => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onResetTitle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2.5 ${
        !widget.visible ? "opacity-50" : ""
      } ${isDragging ? "bg-surface" : ""}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-ink-soft active:cursor-grabbing"
        aria-label="Ubah urutan"
      >
        <GripVertical size={16} />
      </button>

      {/* Title / edit form */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => onEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onConfirmEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              className="flex-1 rounded border border-hairline px-2 py-1 text-sm text-ink outline-none focus:border-brand"
            />
            <button
              onClick={onConfirmEdit}
              className="text-success hover:opacity-75"
              aria-label="Simpan"
            >
              <Check size={14} />
            </button>
            <button
              onClick={onCancelEdit}
              className="text-ink-soft hover:opacity-75"
              aria-label="Batal"
            >
              <X size={14} />
            </button>
            <button
              onClick={onResetTitle}
              className="text-ink-faint hover:opacity-75"
              aria-label="Reset nama"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        ) : (
          <span className="truncate text-sm text-ink">{widget.title}</span>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onStartEdit}
            className="rounded p-1 text-ink-soft transition hover:bg-surface hover:text-ink"
            aria-label="Ubah nama"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onToggle}
            className={`rounded p-1 transition ${
              widget.visible ? "text-brand hover:bg-tint-red" : "text-ink-soft hover:bg-surface"
            }`}
            aria-label={widget.visible ? "Sembunyikan" : "Tampilkan"}
          >
            {widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      )}
    </li>
  );
}
