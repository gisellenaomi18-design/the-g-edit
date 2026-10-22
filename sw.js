/* The G Edit — offline support. Version changes with every release so updates arrive. */
const VERSION = "202610212240";
const CACHE = "gedit-" + VERSION;
const SHELL = ["./", "index.html", "styles.css?v=" + VERSION, "app.js?v=" + VERSION, "config.js?v=" + VERSION, "manifest.webmanifest",
  "fonts/fraunces-latin-500-normal.woff2", "fonts/fraunces-latin-600-normal.woff2", "fonts/fraunces-latin-500-italic.woff2", "fonts/fraunces-latin-600-italic.woff2",
  "fonts/nunito-latin-400-normal.woff2", "fonts/nunito-latin-600-normal.woff2", "fonts/nunito-latin-700-normal.woff2", "fonts/nunito-latin-800-normal.woff2",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); });
self.addEventListener("message", e => { if (e.data === "skip") self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("gedit-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // Firebase traffic goes straight to the network
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("index.html", { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
