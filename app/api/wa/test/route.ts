import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWa, sendWaMedia } from "@/lib/wa/getsender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// URL gambar test publik
const TEST_IMAGE_URL = "https://placehold.co/400x300/ffffff/333333/png?text=Struk+Test";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Tidak terautentikasi" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone ?? "").trim();
  const type: "text" | "media" = body?.type === "media" ? "media" : "text";

  if (!phone) {
    return NextResponse.json({ ok: false, error: "Nomor HP tidak boleh kosong" }, { status: 400 });
  }

  // Normalisasi nomor
  const normalized = phone.replace(/^\+/, "").replace(/^0/, "62");
  console.log(`[wa-test] type=${type}, phone=${phone} -> ${normalized}`);

  let result: { ok: boolean; error?: string };

  if (type === "media") {
    result = await sendWaMedia(normalized, TEST_IMAGE_URL, "Test kirim gambar struk ✅");
  } else {
    result = await sendWa(
      normalized,
      `*Test WhatsApp Gateway*\n\nPesan ini dikirim dari Sabana POS sebagai tes koneksi WA.\n\nJika kamu menerima pesan ini, artinya konfigurasi WA sudah benar ✅`
    );
  }

  console.log(`[wa-test] result:`, result);

  return NextResponse.json(result);
}
