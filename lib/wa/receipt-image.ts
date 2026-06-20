// Generate PNG struk transaksi menggunakan Satori (JSX -> SVG) + @resvg/resvg-wasm (SVG -> PNG).
// Font dibaca dari node_modules/@fontsource/noto-sans (lokal, tanpa CDN).
// Dijalankan di server-side (Node.js runtime). Tidak ada browser dependency.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const satori = require("satori").default as (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  options: {
    width: number;
    height: number;
    fonts: { name: string; data: ArrayBuffer; weight: number; style: string }[];
  }
) => Promise<string>;

import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { readFile } from "fs/promises";
import { join } from "path";

export interface ReceiptImageData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  receiptFooter?: string;
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
  paid?: number;
  change?: number;
}

// Singleton: inisialisasi WASM hanya sekali
let wasmInitialized = false;
async function ensureWasm() {
  if (wasmInitialized) return;
  const wasmPath = join(process.cwd(), "node_modules", "@resvg", "resvg-wasm", "index_bg.wasm");
  const wasmBuffer = await readFile(wasmPath);
  await initWasm(wasmBuffer);
  wasmInitialized = true;
}

// Font cache — baca dari @fontsource/noto-sans lokal, tidak ada CDN
let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

async function getFontRegular(): Promise<ArrayBuffer> {
  if (fontRegular) return fontRegular;
  const path = join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans",
    "files",
    "noto-sans-latin-400-normal.woff"
  );
  const buf = await readFile(path);
  fontRegular = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  return fontRegular;
}

async function getFontBold(): Promise<ArrayBuffer> {
  if (fontBold) return fontBold;
  const path = join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans",
    "files",
    "noto-sans-latin-700-normal.woff"
  );
  const buf = await readFile(path);
  fontBold = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  return fontBold;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rp(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// Helper membuat node satori
function el(
  type: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...children: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return { type, props: { style, children: children.length === 1 ? children[0] : children } };
}

const WIDTH = 384;
const PADDING = 20;
const CONTENT_WIDTH = WIDTH - PADDING * 2;
const DASH = "-".repeat(42);

/**
 * Generate PNG Buffer dari data struk transaksi.
 * Seluruhnya server-side — tidak ada outbound network request.
 */
export async function generateReceiptPng(data: ReceiptImageData): Promise<Buffer> {
  await ensureWasm();
  const [fontReg, fontBld] = await Promise.all([getFontRegular(), getFontBold()]);

  // Hitung tinggi dinamis
  const headerLines = 1 + (data.storeAddress ? 1 : 0) + (data.storePhone ? 1 : 0);
  const headerHeight = 30 + headerLines * 22 + 16;
  const itemsHeight = data.items.length * 22;
  const cashLines = data.paymentMethod === "cash" && typeof data.paid === "number" ? 2 : 0;
  const footerHeight = 80 + cashLines * 20;
  const height = headerHeight + itemsHeight + footerHeight + 60;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemNodes: any[] = data.items.map((item) =>
    el(
      "div",
      {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 3,
        width: CONTENT_WIDTH,
      },
      el("div", { flex: 1, overflow: "hidden" }, `${item.name} x${item.qty}`),
      el("div", { flexShrink: 0, marginLeft: 8 }, rp(item.price * item.qty))
    )
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cashNodes: any[] =
    data.paymentMethod === "cash" && typeof data.paid === "number"
      ? [
          el(
            "div",
            {
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#6B7280",
              marginBottom: 2,
              width: CONTENT_WIDTH,
            },
            el("div", {}, "Tunai"),
            el("div", {}, rp(data.paid))
          ),
          el(
            "div",
            {
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#6B7280",
              marginBottom: 4,
              width: CONTENT_WIDTH,
            },
            el("div", {}, "Kembali"),
            el("div", {}, rp(data.change ?? 0))
          ),
        ]
      : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storeSubLines: any[] = [
    ...(data.storeAddress
      ? [el("div", { fontSize: 11, color: "#6B7280", textAlign: "center" }, data.storeAddress)]
      : []),
    ...(data.storePhone
      ? [
          el(
            "div",
            { fontSize: 11, color: "#6B7280", textAlign: "center" },
            `Telp: ${data.storePhone}`
          ),
        ]
      : []),
  ];

  const tree = el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width: WIDTH,
      minHeight: height,
      backgroundColor: "white",
      padding: PADDING,
      fontFamily: "NotoSans",
      fontSize: 13,
      color: "#1F2937",
    },
    // Header toko
    el(
      "div",
      { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 },
      el(
        "div",
        {
          fontWeight: 700,
          fontSize: 16,
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: 2,
        },
        data.storeName
      ),
      ...storeSubLines
    ),
    // Separator
    el("div", { fontSize: 10, color: "#D1D5DB", marginBottom: 4 }, DASH),
    // Tanggal
    el(
      "div",
      { fontSize: 11, color: "#6B7280", marginBottom: 8, textAlign: "center" },
      formatDate(data.createdAt)
    ),
    // Items
    ...itemNodes,
    // Separator
    el("div", { fontSize: 10, color: "#D1D5DB", marginTop: 4, marginBottom: 6 }, DASH),
    // Total
    el(
      "div",
      {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        fontWeight: 700,
        fontSize: 15,
        marginBottom: 4,
        width: CONTENT_WIDTH,
      },
      el("div", {}, "TOTAL"),
      el("div", {}, rp(data.total))
    ),
    // Cash lines
    ...cashNodes,
    // Metode
    el(
      "div",
      { fontSize: 12, color: "#6B7280", marginBottom: 2 },
      `Metode: ${data.paymentMethod.toUpperCase()}`
    ),
    // Separator
    el("div", { fontSize: 10, color: "#D1D5DB", marginTop: 4, marginBottom: 8 }, DASH),
    // Footer
    el(
      "div",
      { textAlign: "center", fontSize: 12, color: "#6B7280" },
      data.receiptFooter || "Selamat menikmati!"
    )
  );

  const svg = await satori(tree, {
    width: WIDTH,
    height,
    fonts: [
      { name: "NotoSans", data: fontReg, weight: 400, style: "normal" },
      { name: "NotoSans", data: fontBld, weight: 700, style: "normal" },
    ],
  });

  // Convert SVG -> PNG
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}
