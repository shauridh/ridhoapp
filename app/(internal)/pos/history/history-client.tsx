"use client";

import { useEffect, useState, useTransition } from "react";
import { rupiah } from "@/lib/format";
import Link from "next/link";
import { History, Pencil, ChevronLeft, Printer, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { voidOrder, editOrder } from "../actions";
import { useToast } from "@/components/ui/toast";
import { useDialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Receipt } from "../receipt";

const PAGE_SIZE = 20;

interface Order {
  id: string;
  order_number?: number;
  total: number;
  payment_method: string;
  status: string;
  void_reason: string | null;
  created_at: string;
}

type Filter = "all" | "completed" | "voided";

interface Props {
  enableReprint?: boolean;
  extraPaymentMethods?: ("transfer" | "debit")[];
}

export function HistoryClient({ enableReprint = true, extraPaymentMethods = [] }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [editTotal, setEditTotal] = useState("");
  const [editMethod, setEditMethod] = useState<string>("cash");
  const [editReason, setEditReason] = useState("");
  const [reprinting, setReprinting] = useState<Order | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const dialog = useDialog();

  const fetchOrders = async (cursor?: string) => {
    const supabase = createClient();
    let q = supabase
      .from("orders")
      .select("id, order_number, total, payment_method, status, void_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1); // fetch one extra to detect hasMore

    if (cursor) {
      q = q.lt("created_at", cursor);
    }

    const { data, error: err } = await q;
    if (err) return { data: null, error: err.message };
    const rows = (data ?? []) as Order[];
    const hasMore = rows.length > PAGE_SIZE;
    return { data: hasMore ? rows.slice(0, PAGE_SIZE) : rows, hasMore };
  };

  const load = async () => {
    setLoaded(false);
    setError(null);
    const result = await fetchOrders();
    if (!result.data) {
      setError(result.error ?? "Gagal memuat riwayat");
      setLoaded(true);
      return;
    }
    setOrders(result.data);
    setHasMore(result.hasMore ?? false);
    setLoaded(true);
  };

  const loadMore = async () => {
    if (orders.length === 0) return;
    setLoadingMore(true);
    const cursor = orders[orders.length - 1].created_at;
    const result = await fetchOrders(cursor);
    if (result.data) {
      setOrders((prev) => [...prev, ...result.data!]);
      setHasMore(result.hasMore ?? false);
    }
    setLoadingMore(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, []);

  const handleVoid = async (id: string) => {
    const reason = await dialog.prompt("Masukkan alasan void:", "Void Transaksi");
    if (!reason) return;
    const result = await voidOrder(id, reason);
    if (result.ok) {
      toast.show("Transaksi dibatalkan", "success");
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "voided", void_reason: reason } : o))
      );
    } else {
      toast.show(result.error, "error");
    }
  };

  const openEdit = (o: Order) => {
    setEditing(o);
    setEditTotal(String(o.total));
    setEditMethod(o.payment_method);
    setEditReason("");
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editReason.trim()) {
      toast.show("Alasan wajib diisi", "error");
      return;
    }
    const total = Number(editTotal);
    if (Number.isNaN(total) || total < 0) {
      toast.show("Total tidak valid", "error");
      return;
    }
    startTransition(async () => {
      const result = await editOrder(
        editing.id,
        { total, paymentMethod: editMethod as "cash" | "qris" },
        editReason
      );
      if (result.ok) {
        toast.show("Transaksi diubah", "success");
        setOrders((prev) =>
          prev.map((o) => (o.id === editing.id ? { ...o, total, payment_method: editMethod } : o))
        );
        setEditing(null);
      } else {
        toast.show(result.error, "error");
      }
    });
  };

  const visible = orders.filter((o) => (filter === "all" ? true : o.status === filter));

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "completed", label: "Selesai" },
    { key: "voided", label: "Dibatalkan" },
  ];

  const allPaymentMethods = ["cash", "qris", ...extraPaymentMethods];

  return (
    <div className="space-y-4">
      <Link
        href="/pos"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ChevronLeft size={16} /> Kembali ke Kasir
      </Link>
      <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
        <History size={22} className="text-brand" /> Riwayat Transaksi
      </h1>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
              filter === f.key ? "bg-brand text-white" : "bg-white text-ink-soft hover:bg-surface"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-tint-red px-4 py-3">
          <AlertCircle size={18} className="shrink-0 text-danger" />
          <p className="flex-1 text-sm text-danger">{error}</p>
          <button
            onClick={load}
            className="flex items-center gap-1 text-xs font-semibold text-danger underline"
          >
            <RefreshCw size={12} /> Coba lagi
          </button>
        </div>
      )}

      {/* Desktop table */}
      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left text-ink-soft">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Bayar</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr
                key={o.id}
                className="border-b border-hairline last:border-0 text-ink transition hover:bg-surface/50"
              >
                <td className="px-4 py-3 text-ink-soft text-xs">
                  {o.order_number ? `#${String(o.order_number).padStart(3, "0")}` : "—"}
                </td>
                <td className="px-4 py-3">{new Date(o.created_at).toLocaleString("id-ID")}</td>
                <td className="px-4 py-3 text-right font-semibold">{rupiah(o.total)}</td>
                <td className="px-4 py-3">
                  <Badge tone={o.payment_method === "cash" ? "success" : "accent"}>
                    {o.payment_method.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {o.status === "completed" ? (
                    <Badge tone="success">Selesai</Badge>
                  ) : (
                    <Badge tone="danger">Dibatalkan</Badge>
                  )}
                  {o.void_reason && (
                    <span className="ml-1 text-xs text-ink-soft">({o.void_reason})</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {enableReprint && (
                      <Button
                        variant="ghost"
                        size="md"
                        icon={Printer}
                        onClick={() => setReprinting(o)}
                        aria-label="Cetak ulang"
                      >
                        Cetak
                      </Button>
                    )}
                    {o.status === "completed" && (
                      <>
                        <Button
                          variant="secondary"
                          size="md"
                          icon={Pencil}
                          onClick={() => openEdit(o)}
                        >
                          Edit
                        </Button>
                        <Button variant="danger" size="md" onClick={() => handleVoid(o.id)}>
                          Void
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {loaded && !error && visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile card list */}
      <div className="space-y-2 md:hidden">
        {visible.map((o) => (
          <Card key={o.id} className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-ink-soft">
                  {o.order_number ? `#${String(o.order_number).padStart(3, "0")} · ` : ""}
                  {new Date(o.created_at).toLocaleString("id-ID")}
                </p>
                <p className="font-bold text-ink">{rupiah(o.total)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={o.payment_method === "cash" ? "success" : "accent"}>
                  {o.payment_method.toUpperCase()}
                </Badge>
                {o.status === "completed" ? (
                  <Badge tone="success">Selesai</Badge>
                ) : (
                  <Badge tone="danger">Dibatalkan</Badge>
                )}
              </div>
            </div>
            {o.void_reason && <p className="text-xs text-ink-soft">Alasan void: {o.void_reason}</p>}
            <div className="flex gap-1 border-t border-hairline pt-2">
              {enableReprint && (
                <Button
                  variant="ghost"
                  size="md"
                  icon={Printer}
                  onClick={() => setReprinting(o)}
                  className="flex-1"
                >
                  Cetak Ulang
                </Button>
              )}
              {o.status === "completed" && (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={Pencil}
                    onClick={() => openEdit(o)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => handleVoid(o.id)}
                    className="flex-1"
                  >
                    Void
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
        {loaded && !error && visible.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-soft">Belum ada transaksi.</p>
        )}
      </div>

      {/* Pagination */}
      {hasMore && !error && (
        <div className="flex justify-center">
          <Button variant="ghost" loading={loadingMore} onClick={loadMore}>
            Muat lebih banyak
          </Button>
        </div>
      )}

      {/* Edit modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Transaksi"
        size="md"
      >
        {editing && (
          <form onSubmit={handleEdit} className="space-y-3">
            <p className="text-xs text-ink-soft">
              Edit hanya untuk koreksi total atau metode bayar. Untuk ubah item, void transaksi lalu
              buat baru (agar stok ikut dihitung).
            </p>
            <Input
              label="Total (Rp)"
              type="number"
              min={0}
              value={editTotal}
              onChange={(e) => setEditTotal(e.target.value)}
              money
              required
            />
            <Select
              label="Metode Bayar"
              value={editMethod}
              onChange={(e) => setEditMethod(e.target.value)}
            >
              {allPaymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </Select>
            <Input
              label="Alasan perubahan"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="mis. salah input nominal"
              required
            />
            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="primary" loading={pending} className="flex-1">
                Simpan
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Batal
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reprint modal */}
      {reprinting && (
        <Receipt
          order={reprinting}
          items={[]}
          showPrint
          onClose={() => setReprinting(null)}
          orderNumber={reprinting.order_number}
        />
      )}
    </div>
  );
}
