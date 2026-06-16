// =====================================================================
// SW.JS — Minimal offline shell cache for the SPA
// Caches the app shell so the UI loads instantly on repeat visits.
// Realtime data always goes through Supabase (never cached).
// =====================================================================

const CACHE_NAME = "vega-casino-shell-v1";
const SHELL_ASSETS = [
  "/index.html",
  "/app.js",
  "/auth.js",
  "/payment-gateway.js",
  "/supabase-config.js",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache Supabase API/realtime traffic
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // Cache-first for shell assets, network fallback for everything else
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => caches.match("/index.html"));
    })
  );
});
