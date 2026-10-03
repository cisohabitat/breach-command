const CACHE = "breach-command-v43";
const CORE = ["/", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

// Only a complete, successful, same-origin response is worth keeping. Caching an
// error page or a partial response would make it the offline answer for that
// URL until the cache name changes, which is worse than having no answer.
function worthCaching(request, response) {
  return request.method === "GET"
    && !request.headers.has("range")
    && response
    && response.ok
    && response.status === 200
    && response.type === "basic";
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).then(response => {
    if (worthCaching(request, response)) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  }).catch(() => caches.match(request).then(cached => {
    if (cached) return cached;
    // Only a navigation can fall back to the shell; handing the cached document
    // to a script or style request would break the page rather than degrade it.
    return request.mode === "navigate" ? caches.match("/") : Response.error();
  })));
});
