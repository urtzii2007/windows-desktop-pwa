const CACHE = "desktop-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(res => res || fetch(req).then(r => {
      const rClone = r.clone();
      caches.open(CACHE).then(c => c.put(req, rClone)).catch(()=>{});
      return r;
    }).catch(()=>res))
  );
});
