"use client";

import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { AlertCircle, RefreshCw } from "lucide-react";

const PAGE_SIZE = 10;

interface Order {
  id: string;
  order_number?: number;
  total: number;
  payment_method: string;
  paid: number | null;
  change: number | null;
  status: string;
  void_reason: string | null;
  created_at: string;
}

interface OrderDetail extends Order {
  items: Array<{
    product_name: string;
    qty: number;
    unit_price: number;
    subtotal: number;
  }>;
}

export function RecentTransactions() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = async () => {
    setLoaded(false);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("orders")
      .select(
        "id, order_number, total, payment_method, paid, change, status, void_reason, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (err) {
      setError(err.message);
      setLoaded(true);
      return;
    }
    setOrders((data ?? []) as Order[]);
    setLoaded(true);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const handleRowClick = async (orderId: string) => {
    setLoadingDetail(true);
    const supabase = createClient();
    const { data: order } = await supabase
      .from("orders")
      .select(
        "id, order_number, total, payment_method, paid, change, status, void_reason, created_at"
      )
      .eq("id", orderId)
      .single();

    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, qty, unit_price, subtotal")
      .eq("order_id", orderId);

    if (order && items) {
      setSelectedOrder({ ...order, items } as OrderDetail);
    }
    setLoadingDetail(false);
  };

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-danger" />
          <p className="flex-1 text-sm text-danger">{error}</p>
          <button
            onClick={load}
            className="flex items-center gap-1 text-xs font-semibold text-danger underline"
          >
            <RefreshCw size={12} /> Coba lagi
          </button>
        </div>
      </Card>
    );
  }

  if (!loaded) {
    return (
      <Card className="p-4">
        <p className="text-sm text-ink-soft">Memuat...</p>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-ink-soft">Belum ada transaksi hari ini.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left text-ink-soft">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Bayar</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => handleRowClick(o.id)}
                className="cursor-pointer border-b border-hairline last:border-0 text-ink transition hover:bg-surface/50"
              >
                <td className="px-4 py-3 text-ink-soft text-xs">
                  {o.order_number ? `#${String(o.order_number).padStart(3, "0")}` : "—"}
                </td>
                <td className="px-4 py-3 text-xs">
                  {new Date(o.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-right font-semibold">{rupiah(o.total)}</td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      o.payment_method.toLowerCase().includes("cash") ||
                      o.payment_method.toLowerCase().includes("tunai")
                        ? "success"
                        : "accent"
                    }
                  >
                    {o.payment_method.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {o.status === "completed" ? (
                    <Badge tone="success">Selesai</Badge>
                  ) : (
                    <Badge tone="danger">Void</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal Detail */}
      <Modal
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={`Struk #${selectedOrder?.order_number?.toString().padStart(3, "0") || "—"}`}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Waktu</span>
              <span className="text-ink">
                {new Date(selectedOrder.created_at).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Metode Bayar</span>
              <span className="font-semibold text-ink">
                {selectedOrder.payment_method.toUpperCase()}
              </span>
            </div>

            <div className="border-t border-hairline pt-3">
              <h4 className="mb-2 text-xs font-semibold uppercase text-ink-soft">Item</h4>
              <div className="space-y-1">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-ink">
                      {item.product_name} <span className="text-ink-soft">x{item.qty}</span>
                    </span>
                    <span className="font-semibold text-ink">{rupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-surface px-4 py-3">
              <div className="flex justify-between text-sm font-semibold text-ink">
                <span>Total</span>
                <span className="text-lg">{rupiah(selectedOrder.total)}</span>
              </div>
            </div>

            {selectedOrder.paid !== null && selectedOrder.change !== null && (
              <div className="space-y-2 border-t border-hairline pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">Uang Diterima</span>
                  <span className="font-semibold text-ink">{rupiah(selectedOrder.paid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">Kembalian</span>
                  <span className="font-semibold text-success">{rupiah(selectedOrder.change)}</span>
                </div>
              </div>
            )}

            {selectedOrder.void_reason && (
              <div className="rounded-lg bg-tint-red px-3 py-2 text-xs text-danger">
                <span className="font-medium">Alasan Void: </span>
                {selectedOrder.void_reason}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
