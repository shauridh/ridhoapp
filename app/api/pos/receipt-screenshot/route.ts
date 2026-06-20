import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWaMedia } from "@/lib/wa/getsender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "produk-images";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const phone = formData.get("phone") as string | null;
  const orderId = formData.get("orderId") as string | null;

  if (!file || !phone || !orderId) {
    return NextResponse.json(
      { error: `Parameter tidak lengkap: file=${!!file}, phone=${!!phone}, orderId=${!!orderId}` },
      { status: 400 }
    );
  }

  // Normalisasi nomor HP: 08xx -> 628xx, +628xx -> 628xx
  const normalized = phone.replace(/^\+/, "").replace(/^0/, "62");
  console.log("[receipt-screenshot] phone input:", phone, "-> normalized:", normalized);

  // Upload file PNG ke Supabase Storage
  const filePath = `receipts/screenshot-${orderId}-${Date.now()}.png`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log("[receipt-screenshot] uploading", buffer.byteLength, "bytes to", filePath);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: "image/png",
    upsert: true,
  });

  if (uploadError) {
    console.error("[receipt-screenshot] upload error:", uploadError.message);
    return NextResponse.json({ error: `Upload gagal: ${uploadError.message}` }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  console.log("[receipt-screenshot] image URL:", urlData.publicUrl);

  // Kirim ke WA via send-media
  // Tunggu beberapa saat agar getsender.id punya waktu untuk fetch URL
  // PENTING: hapus file SETELAH WA terkirim, bukan sebelum
  const result = await sendWaMedia(normalized, urlData.publicUrl);
  console.log("[receipt-screenshot] WA send result:", result);

  // Hapus file dari storage setelah WA selesai (berhasil atau gagal)
  // Delay kecil untuk memberi waktu getsender.id fetch gambar jika ada async processing
  setTimeout(() => {
    supabase.storage
      .from(BUCKET)
      .remove([filePath])
      .catch(() => {});
  }, 10_000); // 10 detik setelah kirim, cukup waktu untuk diunduh

  if (!result.ok) {
    console.error("[receipt-screenshot] sendWaMedia failed:", result.error);
    return NextResponse.json({ error: result.error ?? "Gagal kirim WA" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
