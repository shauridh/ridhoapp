"use client";

import { useState, useTransition } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { deleteProduct, toggleProductActive } from "./actions";
import { ProductForm } from "./product-form";
import { useDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { CategoryRow } from "@/lib/data/categories";
import type { ProductRow } from "@/lib/data/products";

interface Props {
  product: ProductRow;
  categories: CategoryRow[];
  /** compact = icon-only (untuk grid kecil). Default: false (icon + label) */
  compact?: boolean;
  /** showToggle = tampilkan toggle aktif/nonaktif. Default: true */
  showToggle?: boolean;
}

export function ProductRowActions({
  product,
  categories,
  compact = false,
  showToggle = true,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(product.is_active);
  const toast = useToast();
  const dialog = useDialog();

  const handleDelete = () => {
    dialog.confirm(`Hapus produk "${product.name}"?`, "Hapus Produk").then((ok) => {
      if (!ok) return;
      startTransition(async () => {
        const result = await deleteProduct(product.id);
        if (result.ok) {
          toast.show("Produk dihapus", "success");
        } else {
          toast.show(result.error, "error");
        }
      });
    });
  };

  const handleToggle = () => {
    const next = !active;
    setActive(next); // optimistic update
    startTransition(async () => {
      const result = await toggleProductActive(product.id, next);
      if (!result.ok) {
        setActive(!next); // revert
        toast.show(result.error, "error");
      } else {
        toast.show(next ? "Produk diaktifkan" : "Produk dinonaktifkan", "success");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Toggle aktif/nonaktif */}
        {showToggle && (
          <button
            onClick={handleToggle}
            disabled={pending}
            aria-label={active ? `Nonaktifkan ${product.name}` : `Aktifkan ${product.name}`}
            title={active ? "Nonaktifkan produk" : "Aktifkan produk"}
            className={`relative flex shrink-0 items-center rounded-full transition disabled:opacity-50 ${
              compact ? "h-5 w-9" : "h-5 w-9"
            } ${active ? "bg-success" : "bg-ink-faint"}`}
          >
            <span
              className={`absolute h-4 w-4 rounded-full bg-white shadow transition-all ${
                active ? "left-[18px]" : "left-[2px]"
              }`}
            />
          </button>
        )}
        <button
          onClick={() => setOpen(true)}
          aria-label={`Edit ${product.name}`}
          title="Edit produk"
          className={`flex items-center gap-1.5 rounded-lg text-ink-soft transition hover:bg-surface hover:text-ink ${
            compact ? "h-7 w-7 justify-center" : "h-8 px-2 text-sm"
          }`}
        >
          <Edit2 size={compact ? 13 : 14} />
          {!compact && <span>Edit</span>}
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          aria-label={`Hapus ${product.name}`}
          title="Hapus produk"
          className={`flex items-center gap-1.5 rounded-lg text-danger transition hover:bg-tint-red disabled:opacity-50 ${
            compact ? "h-7 w-7 justify-center" : "h-8 px-2 text-sm"
          }`}
        >
          <Trash2 size={compact ? 13 : 14} />
          {!compact && <span>Hapus</span>}
        </button>
      </div>
      <ProductForm
        categories={categories}
        product={product}
        showButton={false}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
