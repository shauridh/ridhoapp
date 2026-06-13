"use client";

import { useState, useTransition } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { deleteProduct } from "./actions";
import { ProductForm } from "./product-form";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { CategoryRow } from "@/lib/data/categories";
import type { ProductRow } from "@/lib/data/products";

export function ProductRowActions({
  product,
  categories,
}: {
  product: ProductRow;
  categories: CategoryRow[];
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const dialog = useDialog();

  const handleDelete = () => {
    dialog.confirm(`Hapus produk "${product.name}"?`, "Hapus Produk").then((ok) => {
      if (!ok) return;
      startTransition(async () => {
        const result = await deleteProduct(product.id);
        if (result.ok) {
          toast.show("Produk dihapus", "success");
          setOpen(false);
        } else {
          toast.show(result.error, "error");
        }
      });
    });
  };

  return (
    <>
      <div className="flex justify-end gap-2">
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
      <ProductForm categories={categories} product={product} showButton={false} />
    </>
  );
}
