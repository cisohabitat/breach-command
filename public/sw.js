const CACHE = "breach-command-v58";
const CORE = ["/", "/manifest.webmanifest", "/favicon.svg"];

// The page's own scripts and styles are cached on install, read from the page
// itself. Before, only the shell was: the first visit's assets loaded before the
// worker controlled the page, so offline play rested on the browser's HTTP cache
// keeping them, and an evicted cache left an unstyled page that could not start.
// They are content-hashed and the cache is renamed each release, so a stale copy
// is never served.
async function precache(cache) {
  await cache.addAll(CORE);
  const shell = await cache.match("/");
  if (!shell) return;
  const html = await shell.text();
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
  await Promise.all(assets.map(url => cache.add(url).catch(() => {})));
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(precache).then(() => self.skipWaiting()));
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
