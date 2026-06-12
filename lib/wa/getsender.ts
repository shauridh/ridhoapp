// Client untuk WhatsApp gateway getsender.id.
// Best-effort: tidak pernah melempar; selalu mengembalikan { ok, error? }.
const ENDPOINT = "https://seen.getsender.id/send-message"
const TIMEOUT_MS = 8000

export async function sendWa(
  number: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.WA_API_KEY
  const sender = process.env.WA_SENDER
  if (!apiKey || !sender) {
    return { ok: false, error: "WA_API_KEY / WA_SENDER belum diset" }
  }
  if (!number) {
    return { ok: false, error: "Nomor tujuan kosong" }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const body = new URLSearchParams({
      api_key: apiKey,
      sender,
      number,
      message,
      footer: "Sabana POS",
    })
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    })
    if (!res.ok) {
      return { ok: false, error: `Gateway HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal kirim WA"
    return { ok: false, error: msg }
  } finally {
    clearTimeout(timer)
  }
}
