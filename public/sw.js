// Service Worker - Sabana POS
// Strategi: Cache-first untuk aset statis, network-first untuk API/halaman dinamis
// Mendukung offline browsing dan tetap aktif saat device sleep

const CACHE_VERSION = "v1";
const STATIC_CACHE = `sabana-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `sabana-runtime-${CACHE_VERSION}`;

// Aset yang di-precache saat install
const PRECACHE_URLS = ["/", "/pos", "/manifest.json", "/icon-192.png", "/icon-512.png"];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: hapus cache lama ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: strategi hibrida ───────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hanya handle request same-origin
  if (url.origin !== self.location.origin) return;

  // Jangan cache API Supabase / Server Actions
  if (url.pathname.startsWith("/api/") || request.method !== "GET") {
    return;
  }

  // Aset statis (_next/static): cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetchAndCache(request, STATIC_CACHE))
    );
    return;
  }

  // Halaman navigasi & aset lain: network-first, fallback ke cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache response yang valid
        if (response.ok) {
          const cloned = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? offlineFallback(request)))
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
// Digunakan untuk mengirim ulang transaksi yang dibuat saat offline
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-orders") {
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  // Broadcast ke semua tab aktif agar client-side sync handler dijalankan
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage({ type: "SYNC_PENDING_ORDERS" });
  }
}

// ── Keep-alive: Periodic Background Sync ─────────────────────────────────────
// Menjaga koneksi tetap aktif dan sinkronisasi data saat app di background
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "keep-alive") {
    event.waitUntil(keepAlive());
  }
});

async function keepAlive() {
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage({ type: "KEEP_ALIVE" });
  }
}

// ── Push notifications (opsional, untuk order online) ─────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Sabana POS", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Sabana POS", {
      body: data.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag ?? "sabana-notif",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes("/pos"));
      if (existing) return existing.focus();
      return self.clients.openWindow("/pos");
    })
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchAndCache(request, cacheName) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

function offlineFallback(request) {
  if (request.destination === "document") {
    return caches.match("/pos");
  }
  return Response.error();
}
