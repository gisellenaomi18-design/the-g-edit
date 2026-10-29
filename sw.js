/* The G Edit — offline support. Version changes with every release so updates arrive. */
const VERSION = "202610291130";
const CACHE = "gedit-" + VERSION;
const SHELL = ["./", "index.html", "styles.css?v=" + VERSION, "app.js?v=" + VERSION, "config.js?v=" + VERSION, "manifest.webmanifest",
  "fraunces-latin-500-normal.woff2", "fraunces-latin-600-normal.woff2", "fraunces-latin-500-italic.woff2", "fraunces-latin-600-italic.woff2",
  "nunito-latin-400-normal.woff2", "nunito-latin-600-normal.woff2", "nunito-latin-700-normal.woff2", "nunito-latin-800-normal.woff2",
  "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
// cache each file on its own, so one missing file never stops the app's background helper from starting
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))); });
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

/* reminders: show the notification, and open the right page when tapped */
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { data: { body: e.data && e.data.text() } }; }
  const x = Object.assign({}, d.notification || {}, d.data || {});
  e.waitUntil(self.registration.showNotification(x.title || "The G Edit", {
    body: x.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: x.tag || undefined, data: { url: x.url || "./" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if ("focus" in c) { if ("navigate" in c) c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
