"use client"

import { useState, useTransition } from "react"
import { Tags, Plus, ChevronUp, ChevronDown, Pencil, Trash2, Check, X } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { useDialog } from "@/components/ui/dialog"
import {
  addCategory,
  renameCategory,
  deleteCategory,
  reorderCategories,
} from "./category-actions"
import type { CategoryRow } from "@/lib/data/categories"

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(categories)
  const [newName, setNewName] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [pending, startTransition] = useTransition()
  const toast = useToast()
  const dialog = useDialog()

  // Sinkronkan kalau prop berubah (mis. setelah revalidate).
  if (categories !== items && !open) {
    // no-op: hanya reset saat panel tertutup untuk hindari override saat edit
  }

  const refresh = (next: CategoryRow[]) => setItems(next)

  const handleAdd = () => {
    if (!newName.trim()) return
    startTransition(async () => {
      const result = await addCategory(newName)
      if (result.ok) {
        toast.show("Kategori ditambahkan", "success")
        setNewName("")
        // optimistic: tambahkan ke list lokal
        setItems((prev) => [
          ...prev,
          { id: `tmp-${Date.now()}`, name: newName.trim(), sort_order: 9999 },
        ])
      } else {
        toast.show(result.error, "error")
      }
    })
  }

  const handleRename = (id: string) => {
    startTransition(async () => {
      const result = await renameCategory(id, editName)
      if (result.ok) {
        toast.show("Kategori diubah", "success")
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c)),
        )
        setEditId(null)
      } else {
        toast.show(result.error, "error")
      }
    })
  }

  const handleDelete = async (c: CategoryRow) => {
    const ok = await dialog.confirm(`Hapus kategori "${c.name}"?`, "Hapus Kategori")
    if (!ok) return
    startTransition(async () => {
      const result = await deleteCategory(c.id)
      if (result.ok) {
        toast.show("Kategori dihapus", "success")
        setItems((prev) => prev.filter((x) => x.id !== c.id))
      } else {
        toast.show(result.error, "error")
      }
    })
  }

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    startTransition(async () => {
      await reorderCategories(next.map((c) => c.id))
    })
  }

  return (
    <>
      <Button variant="secondary" icon={Tags} onClick={() => setOpen(true)}>
        Kategori
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Kelola Kategori"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama kategori baru"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAdd()
                }
              }}
            />
            <Button icon={Plus} onClick={handleAdd} disabled={pending}>
              Tambah
            </Button>
          </div>

          <div className="space-y-2">
            {items.length === 0 && (
              <p className="py-4 text-center text-sm text-ink-soft">
                Belum ada kategori.
              </p>
            )}
            {items.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-2"
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || pending}
                    className="text-ink-soft disabled:opacity-30"
                    aria-label="Naik"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1 || pending}
                    className="text-ink-soft disabled:opacity-30"
                    aria-label="Turun"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {editId === c.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                    />
                    <button
                      onClick={() => handleRename(c.id)}
                      className="text-success"
                      aria-label="Simpan"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="text-ink-soft"
                      aria-label="Batal"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-ink">{c.name}</span>
                    <button
                      onClick={() => {
                        setEditId(c.id)
                        setEditName(c.name)
                      }}
                      className="text-ink-soft hover:text-brand"
                      aria-label="Ubah"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="text-ink-soft hover:text-danger"
                      aria-label="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint">
            Urutan di sini menentukan urutan kategori di kasir.
          </p>
        </div>
      </Modal>
    </>
  )
}
