"use client";

import { useState, useTransition } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { deleteIngredient } from "./actions";
import { IngredientForm } from "./ingredient-form";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { IngredientRow } from "@/lib/data/inventory";

export function IngredientRowActions({ ingredient }: { ingredient: IngredientRow }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const dialog = useDialog();

  const handleDelete = () => {
    dialog.confirm(`Hapus bahan "${ingredient.name}"?`, "Hapus Bahan").then((ok) => {
      if (!ok) return;
      startTransition(async () => {
        const result = await deleteIngredient(ingredient.id);
        if (result.ok) toast.show("Bahan dihapus", "success");
        else toast.show(result.error, "error");
      });
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <IngredientForm
          ingredient={ingredient}
          showButton={false}
          open={open}
          onOpenChange={setOpen}
        />
        <Button variant="ghost" size="md" icon={Edit2} onClick={() => setOpen(true)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="md"
          icon={Trash2}
          onClick={handleDelete}
          disabled={pending}
          className="text-danger hover:text-danger"
        >
          Hapus
        </Button>
      </div>
    </>
  );
}
