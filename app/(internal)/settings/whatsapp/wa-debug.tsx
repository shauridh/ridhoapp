"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Send, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TestStatus = "idle" | "loading" | "ok" | "error";

async function testSendText(phone: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/wa/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, type: "text" }),
  });
  return res.json();
}

async function testSendMedia(phone: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/wa/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, type: "media" }),
  });
  return res.json();
}

export function WaDebug() {
  const [phone, setPhone] = useState("");
  const [textStatus, setTextStatus] = useState<TestStatus>("idle");
  const [textError, setTextError] = useState("");
  const [mediaStatus, setMediaStatus] = useState<TestStatus>("idle");
  const [mediaError, setMediaError] = useState("");

  const handleTestText = async () => {
    if (!phone.trim()) return;
    setTextStatus("loading");
    setTextError("");
    const result = await testSendText(phone.trim());
    setTextStatus(result.ok ? "ok" : "error");
    if (!result.ok) setTextError(result.error ?? "Gagal");
  };

  const handleTestMedia = async () => {
    if (!phone.trim()) return;
    setMediaStatus("loading");
    setMediaError("");
    const result = await testSendMedia(phone.trim());
    setMediaStatus(result.ok ? "ok" : "error");
    if (!result.ok) setMediaError(result.error ?? "Gagal");
  };

  return (
    <div className="max-w-lg rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-ink">Test & Debug WhatsApp</h3>
      <p className="mb-4 text-xs text-ink-soft">
        Kirim pesan test ke nomor tertentu untuk memastikan koneksi WA gateway berjalan.
      </p>

      <div className="mb-4">
        <Input
          label="Nomor tujuan test"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
          type="tel"
        />
      </div>

      <div className="flex flex-col gap-3">
        {/* Test kirim teks */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={Send}
            onClick={handleTestText}
            disabled={!phone.trim() || textStatus === "loading"}
            loading={textStatus === "loading"}
            className="w-40"
          >
            Test Teks
          </Button>
          <StatusBadge status={textStatus} error={textError} />
        </div>

        {/* Test kirim gambar */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={ImageIcon}
            onClick={handleTestMedia}
            disabled={!phone.trim() || mediaStatus === "loading"}
            loading={mediaStatus === "loading"}
            className="w-40"
          >
            Test Gambar
          </Button>
          <StatusBadge status={mediaStatus} error={mediaError} />
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-surface px-3 py-2 text-xs text-ink-soft">
        <p className="font-medium text-ink">Cara debug jika gagal:</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>
            Cek <code className="font-mono">WA_API_KEY</code> dan{" "}
            <code className="font-mono">WA_SENDER</code> sudah diset di environment variables
          </li>
          <li>Pastikan sender WA di getsender.id sedang aktif / terhubung</li>
          <li>
            Nomor tujuan harus format <code className="font-mono">628xx</code> atau{" "}
            <code className="font-mono">08xx</code> (di-normalize otomatis)
          </li>
          <li>Buka server logs untuk melihat detail error dari gateway</li>
        </ul>
      </div>
    </div>
  );
}

function StatusBadge({ status, error }: { status: TestStatus; error: string }) {
  if (status === "idle") return null;
  if (status === "loading")
    return (
      <div className="flex items-center gap-1.5 text-sm text-ink-soft">
        <Loader2 size={14} className="animate-spin" />
        Mengirim...
      </div>
    );
  if (status === "ok")
    return (
      <div className="flex items-center gap-1.5 text-sm text-success">
        <CheckCircle size={14} />
        Terkirim!
      </div>
    );
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-sm text-danger">
        <XCircle size={14} />
        Gagal
      </div>
      {error && <div className="mt-0.5 max-w-xs break-words text-xs text-danger">{error}</div>}
    </div>
  );
}
