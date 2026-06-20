"use client";

import { useState, useTransition } from "react";
import { Upload, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { saveOnlineSettings } from "../app-settings-actions";
import { uploadProductImage } from "../menu/image-actions";

interface Props {
  qrisString: string;
  qrisImage: string;
  onlineEnabled: string;
}

function DeliveryLinkBox() {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const orderUrl = appUrl ? `${appUrl}/order` : null;

  if (!orderUrl) {
    return (
      <div className="rounded-2xl bg-tint-amber px-4 py-3">
        <p className="text-sm font-semibold text-ink">Link Pemesanan Online</p>
        <p className="mt-1 text-xs text-ink-soft">
          Tambahkan{" "}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-xs font-bold">
            NEXT_PUBLIC_APP_URL
          </code>{" "}
          ke environment variables deployment kamu (misal:{" "}
          <code className="font-mono text-xs">https://sabana.vercel.app</code>), lalu redeploy. Link
          pemesanan pelanggan akan tampil di sini.
        </p>
        <p className="mt-2 text-xs text-ink-soft">
          Cara setup di Vercel: Settings → Environment Variables → Add{" "}
          <code className="font-mono font-bold">NEXT_PUBLIC_APP_URL</code> → Redeploy.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-tint-blue px-4 py-3">
      <p className="text-sm font-semibold text-info">Link Pemesanan Online</p>
      <p className="mt-0.5 text-xs text-ink-soft">
        Bagikan link ini ke pelanggan untuk pesan secara online.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 break-all rounded-lg bg-white px-3 py-2 text-sm text-ink">
          {orderUrl}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(orderUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-white transition hover:bg-surface"
          title={copied ? "Tersalin!" : "Salin link"}
          aria-label={copied ? "Tersalin!" : "Salin link"}
        >
          {copied ? (
            <Check size={15} className="text-success" />
          ) : (
            <Copy size={15} className="text-ink-soft" />
          )}
        </button>
      </div>
    </div>
  );
}

export function OnlineForm({ qrisString, qrisImage, onlineEnabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState(qrisImage);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadProductImage(fd);
      if (result.ok) {
        setImageUrl(result.url);
        toast.show("Gambar QRIS terunggah", "success");
      } else {
        toast.show(result.error, "error");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveOnlineSettings(fd);
      if (result.ok) toast.show("Tersimpan", "success");
      else toast.show(result.error, "error");
    });
  };

  return (
    <div className="space-y-4">
      {/* Link pemesanan online */}
      <DeliveryLinkBox />

      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Gambar QRIS</label>
          <input type="hidden" name="qris_image" value={imageUrl} />
          <div className="flex items-center gap-3">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="QRIS"
                className="h-28 w-28 rounded-xl border border-hairline object-contain"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-hairline text-xs text-ink-faint">
                Belum ada
              </div>
            )}
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface">
                <Upload size={18} />
                {uploading ? "Mengunggah..." : "Unggah Gambar"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                  disabled={uploading}
                />
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-xs text-danger"
                >
                  Hapus gambar
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            Gambar QRIS ini akan ditampilkan di layar pembayaran kasir.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            QRIS Static String (opsional)
          </label>
          <textarea
            name="qris_string"
            rows={3}
            defaultValue={qrisString}
            placeholder="00020101021126660016ID.CO.SHOP..."
            className="w-full rounded-xl border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
          <p className="mt-1 text-xs text-ink-faint">
            Untuk QR dinamis (generate otomatis berdasar nominal). Boleh dikosongkan jika sudah
            pakai gambar QRIS di atas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="online_enabled"
            id="online_enabled"
            value="true"
            defaultChecked={onlineEnabled === "true"}
            className="h-5 w-5 rounded accent-brand"
          />
          <label htmlFor="online_enabled" className="text-sm font-medium text-ink">
            Aktifkan pesanan online
          </label>
        </div>

        <Button type="submit" disabled={pending || uploading}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </div>
  );
}
