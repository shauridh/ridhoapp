"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { addIngredient, updateIngredient } from "./actions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { USAGE_UNITS, PURCHASE_UNITS } from "@/lib/domain/units";
import type { IngredientRow } from "@/lib/data/inventory";

export function IngredientForm({
  ingredient,
  showButton = true,
}: {
  ingredient?: IngredientRow;
  showButton?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setError(null);
  };

  const action = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = ingredient
        ? await updateIngredient(ingredient.id, formData)
        : await addIngredient(formData);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  return (
    <>
      {showButton && (
        <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
          {ingredient ? "Edit Bahan" : "Tambah Bahan"}
        </Button>
      )}

      <Modal open={open} onClose={close} title={ingredient ? "Edit Bahan" : "Bahan Baru"} size="md">
        <form key={ingredient?.id ?? "create"} action={action} className="space-y-4">
          <Input name="name" label="Nama bahan" required defaultValue={ingredient?.name} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Select name="unit" label="Satuan pakai" required defaultValue={ingredient?.unit}>
              {USAGE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
            <Select
              name="trackingType"
              label="Tipe"
              defaultValue={ingredient?.tracking_type ?? "ingredient"}
            >
              <option value="ingredient">Bahan baku</option>
              <option value="finished">Produk jadi</option>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              name="purchaseUnit"
              label="Satuan beli"
              defaultValue={ingredient?.purchase_unit ?? ""}
            >
              <option value="">—</option>
              {PURCHASE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
            <Input
              name="purchaseUnitQty"
              label="Isi per satuan beli"
              type="number"
              step="0.0001"
              defaultValue={ingredient?.purchase_unit_qty ?? 1}
            />
          </div>

          <Input
            name="lowStockThreshold"
            label="Batas menipis (peringatan)"
            type="number"
            step="0.0001"
            defaultValue={0}
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" disabled={pending} className="flex-1">
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button type="button" variant="ghost" onClick={close}>
              Batal
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </Modal>
    </>
  );
}
