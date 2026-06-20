// Client untuk WhatsApp gateway getsender.id.
// Best-effort: tidak pernah melempar; selalu mengembalikan { ok, error? }.
const SEND_MESSAGE_ENDPOINT = "https://seen.getsender.id/send-message";
const SEND_MEDIA_ENDPOINT = "https://seen.getsender.id/send-media";
const TIMEOUT_MS = 8000;

async function postForm(
  endpoint: string,
  params: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body = new URLSearchParams(params);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      // Baca body error dari gateway untuk membantu debugging
      let detail = "";
      try {
        detail = await res.text();
      } catch {
        // abaikan jika gagal baca body
      }
      const errMsg = detail
        ? `Gateway HTTP ${res.status}: ${detail.slice(0, 200)}`
        : `Gateway HTTP ${res.status}`;
      return { ok: false, error: errMsg };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal kirim WA";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

function getCredentials(): { apiKey: string; sender: string } | null {
  const apiKey = process.env.WA_API_KEY;
  const sender = process.env.WA_SENDER;
  if (!apiKey || !sender) return null;
  return { apiKey, sender };
}

/**
 * Kirim pesan teks WhatsApp.
 */
export async function sendWa(
  number: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const creds = getCredentials();
  if (!creds) return { ok: false, error: "WA_API_KEY / WA_SENDER belum diset" };
  if (!number) return { ok: false, error: "Nomor tujuan kosong" };

  return postForm(SEND_MESSAGE_ENDPOINT, {
    api_key: creds.apiKey,
    sender: creds.sender,
    number,
    message,
  });
}

/**
 * Kirim gambar WhatsApp via URL publik.
 * Caption opsional (teks di bawah gambar).
 */
export async function sendWaMedia(
  number: string,
  imageUrl: string,
  caption?: string
): Promise<{ ok: boolean; error?: string }> {
  const creds = getCredentials();
  if (!creds) return { ok: false, error: "WA_API_KEY / WA_SENDER belum diset" };
  if (!number) return { ok: false, error: "Nomor tujuan kosong" };
  if (!imageUrl) return { ok: false, error: "URL gambar kosong" };

  const params: Record<string, string> = {
    api_key: creds.apiKey,
    sender: creds.sender,
    number,
    media_type: "image",
    url: imageUrl,
  };
  if (caption) params.caption = caption;

  return postForm(SEND_MEDIA_ENDPOINT, params);
}
