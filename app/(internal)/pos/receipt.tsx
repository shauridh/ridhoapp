"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Printer,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  RulerIcon,
  Share2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceiptOrder {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
}

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

type WaStatus = "sending" | "sent" | "failed" | null;
type ReceiptWidth = "58" | "80";

interface Props {
  order: ReceiptOrder;
  items: ReceiptItem[];
  paid?: number;
  change?: number;
  showPrint?: boolean;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptFooter?: string;
  orderNumber?: number;
  customerPhone?: string; // auto-trigger WA setelah render
  onClose: () => void;
}

const AUTO_CLOSE_SECONDS = 60;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Build struk HTML dengan inline styles (tanpa Tailwind/oklch) untuk html2canvas. */
function buildReceiptHtml(p: {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  receiptFooter?: string;
  orderNumber?: number;
  order: ReceiptOrder;
  items: ReceiptItem[];
  paid?: number;
  change?: number;
}): string {
  const sep = `<div style="border-top:1px dashed #ccc;margin:10px 0"></div>`;
  const row = (l: string, r: string, bold = false) =>
    `<div style="display:flex;justify-content:space-between;${bold ? "font-weight:700;" : ""}margin-bottom:3px">
      <span>${l}</span><span style="font-variant-numeric:tabular-nums">${r}</span>
    </div>`;
  const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  const headerLines = [
    `<div style="text-align:center;font-weight:900;text-transform:uppercase;letter-spacing:2px;font-size:15px">${p.storeName}</div>`,
    p.storeAddress
      ? `<div style="text-align:center;font-size:11px;color:#555">${p.storeAddress}</div>`
      : "",
    p.storePhone
      ? `<div style="text-align:center;font-size:11px;color:#555">Tel: ${p.storePhone}</div>`
      : "",
    p.orderNumber !== undefined
      ? `<div style="text-align:center;font-size:12px;font-weight:700;margin-top:4px"># ${String(p.orderNumber).padStart(3, "0")}</div>`
      : "",
  ].join("");

  const itemsHtml = p.items
    .map((item) =>
      row(
        `${item.name} <span style="color:#888">&times;${item.qty}</span>`,
        rp(item.price * item.qty)
      )
    )
    .join("");

  const cashLines =
    typeof p.paid === "number" && p.order.payment_method === "cash"
      ? [row("Tunai", rp(p.paid)), row("Kembali", rp(p.change ?? 0))].join("")
      : "";

  return [
    headerLines,
    sep,
    `<div style="text-align:center;font-size:11px;color:#888;margin-bottom:8px">${formatDate(p.order.created_at)}</div>`,
    itemsHtml,
    sep,
    row("TOTAL", rp(p.order.total), true),
    cashLines,
    `<div style="font-size:11px;color:#888;margin-top:4px">Metode: ${p.order.payment_method.toUpperCase()}</div>`,
    sep,
    `<div style="text-align:center;font-size:11px;color:#888">${p.receiptFooter || "Selamat menikmati!"}</div>`,
  ].join("");
}

export function Receipt({
  order,
  items,
  paid,
  change,
  showPrint = false,
  storeName = "Sabana POS",
  storeAddress,
  storePhone,
  receiptFooter,
  orderNumber,
  customerPhone,
  onClose,
}: Props) {
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SECONDS);
  const [receiptWidth, setReceiptWidth] = useState<ReceiptWidth>(() => {
    if (typeof window === "undefined") return "58";
    return (localStorage.getItem("pos.receiptWidth") as ReceiptWidth) ?? "58";
  });

  // WA share state — dipakai untuk auto-send dan manual share
  const [showShareWa, setShowShareWa] = useState(false);
  const [sharePhone, setSharePhone] = useState("");
  const [waStatus, setWaStatus] = useState<WaStatus>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const autoSendRef = useRef(false);

  // Auto-close countdown
  useEffect(() => {
    if (countdown <= 0) {
      onClose();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onClose]);

  // Fungsi capture screenshot + kirim WA — dibungkus useCallback
  const captureAndSendWa = useCallback(
    async (phone: string) => {
      if (!receiptRef.current) {
        setWaStatus("failed");
        return;
      }
      setWaStatus("sending");
      try {
        const html2canvas = (await import("html2canvas")).default;
        // html2canvas tidak support oklch/lab color (Tailwind v4).
        // Gunakan offscreenEl dengan inline styles agar tidak ada CSS color modern.
        const offscreen = document.createElement("div");
        offscreen.style.cssText = [
          "position:fixed",
          "left:-9999px",
          "top:0",
          "background:#fff",
          "width:320px",
          "padding:20px",
          "font-family:sans-serif",
          "font-size:13px",
          "color:#111",
          "line-height:1.5",
        ].join(";");
        offscreen.innerHTML = buildReceiptHtml({
          storeName: storeName ?? "Sabana POS",
          storeAddress,
          storePhone,
          receiptFooter,
          orderNumber,
          order,
          items,
          paid,
          change,
        });
        document.body.appendChild(offscreen);
        const canvas = await html2canvas(offscreen, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
        });
        document.body.removeChild(offscreen);
        const blob: Blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob gagal"))),
            "image/png",
            0.95
          );
        });
        const formData = new FormData();
        formData.append("file", blob, `struk-${order.id}.png`);
        formData.append("phone", phone);
        formData.append("orderId", order.id);

        const res = await fetch("/api/pos/receipt-screenshot", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.error("[receipt] WA send failed:", errBody?.error);
          setWaStatus("failed");
        } else {
          setWaStatus("sent");
        }
      } catch (err) {
        console.error("[receipt] captureAndSendWa exception:", err);
        setWaStatus("failed");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [order.id]
  );

  // Auto-send ditangani oleh server action (Satori PNG) di pos-client.tsx.
  // useEffect ini dihapus — tidak lagi pakai html2canvas untuk auto-send.
  // captureAndSendWa masih tersedia untuk tombol "Bagikan" manual.

  const handleWidthToggle = (w: ReceiptWidth) => {
    setReceiptWidth(w);
    localStorage.setItem("pos.receiptWidth", w);
  };

  const handlePrint = () => {
    const styleId = "receipt-page-size-override";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `@page { size: ${receiptWidth}mm auto; margin: 2mm; }`;
    window.addEventListener("afterprint", () => style?.remove(), { once: true });
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-lg">
        {/* Header modal */}
        <div className="no-print flex items-center justify-between border-b border-hairline px-5 py-3">
          <h3 className="font-semibold text-ink">Struk Transaksi</h3>
          <button onClick={onClose} aria-label="Tutup" className="text-ink-soft hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {/* ===== KONTEN STRUK (di-screenshot oleh html2canvas) ===== */}
        <div ref={receiptRef} className="receipt-print bg-white px-5 py-4">
          {/* Header toko */}
          <div className="text-center">
            <div className="text-base font-extrabold uppercase tracking-widest text-ink">
              {storeName}
            </div>
            {storeAddress && <div className="mt-0.5 text-[11px] text-ink-soft">{storeAddress}</div>}
            {storePhone && <div className="text-[11px] text-ink-soft">Tel: {storePhone}</div>}
            {/* Nomor order — reset harian */}
            {orderNumber !== undefined && (
              <div className="mt-1 text-xs font-bold text-ink">
                # {String(orderNumber).padStart(3, "0")}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="my-3 border-t border-dashed border-gray-200" />

          {/* Tanggal */}
          <div className="mb-3 text-center text-[11px] text-ink-soft">
            {formatDate(order.created_at)}
          </div>

          {/* Item-item — no truncate, allow wrap */}
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div className="flex-1 text-sm leading-snug text-ink">
                  {item.name}
                  <span className="ml-1 text-ink-soft">×{item.qty}</span>
                </div>
                <span className="shrink-0 tabular-nums text-sm text-ink">
                  Rp {(item.price * item.qty).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div className="my-3 border-t border-dashed border-gray-200" />

          {/* Total */}
          <div className="flex items-center justify-between font-bold">
            <span className="text-sm text-ink">TOTAL</span>
            <span className="tabular-nums text-sm text-ink">
              Rp {order.total.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Tunai & kembalian */}
          {typeof paid === "number" && order.payment_method === "cash" && (
            <div className="mt-1.5 space-y-0.5">
              <div className="flex justify-between text-[11px] text-ink-soft">
                <span>Tunai</span>
                <span className="tabular-nums">Rp {paid.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-[11px] text-ink-soft">
                <span>Kembali</span>
                <span className="tabular-nums">Rp {(change ?? 0).toLocaleString("id-ID")}</span>
              </div>
            </div>
          )}

          {/* Metode */}
          <div className="mt-1.5 text-[11px] text-ink-soft">
            Metode: {order.payment_method.toUpperCase()}
          </div>

          {/* Separator */}
          <div className="my-3 border-t border-dashed border-gray-200" />

          {/* Footer */}
          <div className="text-center text-[11px] text-ink-soft">
            {receiptFooter || "Selamat menikmati!"}
          </div>
        </div>
        {/* ===== AKHIR KONTEN STRUK ===== */}

        {/* Status WA */}
        <div className="no-print min-h-6 px-5">
          {waStatus === "sending" && (
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Loader2 size={14} className="animate-spin" />
              Mengirim struk ke WA...
            </div>
          )}
          {waStatus === "sent" && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle size={14} />
              Struk terkirim ke WA
            </div>
          )}
          {waStatus === "failed" && (
            <div className="flex items-center gap-2 text-sm text-danger">
              <XCircle size={14} />
              Gagal mengirim struk ke WA
            </div>
          )}
        </div>

        {/* Panel bagikan manual via WA */}
        {showShareWa && (
          <div className="no-print border-t border-hairline px-5 py-3">
            <p className="mb-2 text-xs text-ink-soft">Masukkan nomor WA pelanggan:</p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={sharePhone}
                onChange={(e) => setSharePhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="flex-1 rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                autoFocus
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => captureAndSendWa(sharePhone)}
                disabled={!sharePhone.trim() || waStatus === "sending"}
                loading={waStatus === "sending"}
              >
                Kirim
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="no-print space-y-2 p-5 pt-3">
          <div className="flex gap-2">
            {showPrint && (
              <>
                <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface p-1 text-xs">
                  <RulerIcon size={12} className="ml-1 text-ink-soft" />
                  <button
                    onClick={() => handleWidthToggle("58")}
                    className={`rounded px-2 py-0.5 font-medium transition ${
                      receiptWidth === "58"
                        ? "bg-white text-ink shadow-sm"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    58mm
                  </button>
                  <button
                    onClick={() => handleWidthToggle("80")}
                    className={`rounded px-2 py-0.5 font-medium transition ${
                      receiptWidth === "80"
                        ? "bg-white text-ink shadow-sm"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    80mm
                  </button>
                </div>
                <Button variant="ghost" icon={Printer} onClick={handlePrint} className="flex-1">
                  Cetak
                </Button>
              </>
            )}

            {/* Tombol bagikan struk via WA */}
            <Button
              variant={showShareWa ? "secondary" : "ghost"}
              icon={showShareWa ? MessageCircle : Share2}
              onClick={() => {
                setShowShareWa((v) => !v);
                if (waStatus !== "sending") setWaStatus(null);
              }}
              className={showPrint ? "" : "flex-1"}
            >
              {showShareWa ? "Batal" : "Bagikan"}
            </Button>
          </div>

          <Button variant="primary" size="lg" onClick={onClose} className="w-full">
            Tutup ({countdown})
          </Button>
        </div>
      </div>
    </div>
  );
}
