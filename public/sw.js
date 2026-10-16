// The cache is named for the release and build the page registered this worker
// with (/sw.js?v=<version>-<build>), so every deploy gets a cache of its own and
// the old one is deleted on activation. It was a number bumped by hand.
const PREFIX = "breach-command-";
const CACHE = `${PREFIX}${new URL(self.location.href).searchParams.get("v") || "dev"}`;
const CORE = ["/", "/play", "/manifest.webmanifest", "/favicon.svg"];

// The page's own scripts and styles are cached on install, read from the page
// itself. Before, only the shell was: the first visit's assets loaded before the
// worker controlled the page, so offline play rested on the browser's HTTP cache
// keeping them, and an evicted cache left an unstyled page that could not start.
// They are content-hashed and the cache is renamed each release, so a stale copy
// is never served.
async function precache(cache) {
  async function keep(url) {
    const response = await fetch(url, { cache: "reload" });
    if (!publicResponse(response)) throw new Error("Uncacheable public asset");
    await cache.put(url, response);
  }
  await Promise.all(CORE.map(keep));
  // The artwork is not precached: about 2.4 MB of decorative images would be
  // fetched on a first visit, on whatever connection the player has. The fetch
  // handler below keeps each image the player has seen, so it is there offline
  // the next time; one never seen leaves an empty, unlabelled space.
  const html = (await Promise.all(["/", "/play"].map(async path => {
    const shell = await cache.match(path);
    return shell ? shell.text() : "";
  }))).join("\n");
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
  await Promise.all(assets.map(url => keep(url).catch(() => {})));
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(precache).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

// Only published game documents and assets belong in this cache. In particular,
// never persist arbitrary same-origin endpoints, RSC/prefetch responses, or
// query variants that could later represent authenticated or personalised data.
function cacheableRequest(request) {
  const url = new URL(request.url);
  return request.method === "GET" && url.origin === self.location.origin
    && (!url.search || request.mode === "navigate") && !request.headers.has("range")
    && !request.headers.has("authorization") && !request.headers.has("rsc")
    && ((request.mode === "navigate" && (url.pathname === "/" || url.pathname === "/play" || url.pathname === "/educators"))
      || url.pathname.startsWith("/_next/static/")
      || /^\/art\/[a-z0-9/_-]+\.webp$/.test(url.pathname)
      || /^\/art\/title\/(portrait|landscape)\.jpg$/.test(url.pathname)
      || /^\/audio\/[a-zA-Z0-9/_-]+\.(mp3|ogg|wav)$/.test(url.pathname)
      || url.pathname === "/manifest.webmanifest" || url.pathname === "/favicon.svg");
}

// Only a complete, successful, same-origin response is worth keeping. Caching an
// error page or a partial response would make it the offline answer for that
// URL until the cache name changes, which is worse than having no answer.
function worthCaching(request, response) {
  return cacheableRequest(request)
    && !new URL(request.url).search
    && publicResponse(response);
}

function publicResponse(response) {
  return response
    && response.ok
    && response.status === 200
    && response.type === "basic"
    && !response.redirected
    && !/\b(no-store|private)\b/i.test(response.headers.get("cache-control") || "");
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (!cacheableRequest(request)) return;
  // Register the lifetime promise synchronously, before fetch settles.
  const response = fetch(request);
  event.waitUntil(response.then(response => {
    if (worthCaching(request, response)) {
      const copy = response.clone();
      return caches.open(CACHE).then(cache => cache.put(request, copy));
    }
  }).catch(() => {}));
  event.respondWith(response.catch(() => caches.open(CACHE).then(async cache => {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Only a navigation can fall back to the shell; handing the cached document
    // to a script or style request would break the page rather than degrade it.
    return request.mode === "navigate" ? (await cache.match(new URL(request.url).pathname === "/play" ? "/play" : "/")) || Response.error() : Response.error();
  })));
});
