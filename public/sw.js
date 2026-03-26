const CACHE_NAME = "rss-reader-v2";
const APP_SHELL = ["/", "/reader"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API routes
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: "Offline" }), {
        headers: { "Content-Type": "application/json" },
      }))
    );
    return;
  }

  // Cache-first only for images and fonts
  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Network-first for everything else (scripts, styles, navigation)
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
