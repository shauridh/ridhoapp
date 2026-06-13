"use client";

import { useState, useTransition } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { deleteVariant, updateVariant } from "./variant-actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { VariantRow } from "@/lib/data/products";

export function VariantRowActions({
  productId,
  variant,
}: {
  productId: string;
  variant: VariantRow;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const dialog = useDialog();

  const handleDelete = () => {
    dialog.confirm(`Hapus varian "${variant.name}"?`, "Hapus Varian").then((ok) => {
      if (!ok) return;
      startTransition(async () => {
        const result = await deleteVariant(variant.id, productId);
        if (result.ok) toast.show("Varian dihapus", "success");
        else toast.show(result.error, "error");
      });
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="text-ink-soft hover:text-brand"
          aria-label="Ubah varian"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={handleDelete}
          className="text-ink-soft hover:text-danger"
          aria-label="Hapus varian"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Varian" size="md">
        <form
          key={variant.id}
          action={(formData) => {
            startTransition(async () => {
              const result = await updateVariant(variant.id, productId, formData);
              if (result.ok) {
                toast.show("Varian diubah", "success");
                setOpen(false);
              } else {
                toast.show(result.error, "error");
              }
            });
          }}
          className="space-y-4"
        >
          <Input label="Nama varian" name="name" required defaultValue={variant.name} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Tambahan harga"
              name="priceDelta"
              type="number"
              step="0.01"
              defaultValue={variant.price_delta}
              money
            />
            <Select label="Tipe" name="type" defaultValue={variant.type}>
              <option value="addon">Tambahan (addon)</option>
              <option value="option">Pilihan (option)</option>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input name="isRequired" type="checkbox" defaultChecked={variant.is_required} /> Wajib
            dipilih
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
