// Service worker de la app de Mamá.
// - Con internet: siempre carga la versión más reciente de la app (red primero).
// - Sin internet: usa la copia guardada, así la app funciona offline.
// - Si falta algún archivo, la instalación no se traba.
const CACHE_NAME = "forja-mama-v9";
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(APP_SHELL.map((url) =>
        cache.add(new Request(url, { cache: "reload" })).catch(() => null)
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const esPagina = req.mode === "navigate" || req.url.endsWith("/index.html") || req.url.endsWith("/");
  if (esPagina) {
    // Red primero: si hay internet, la versión nueva; si no, la guardada.
    event.respondWith(
      fetch(req, { cache: "no-store" })
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("./index.html", copia)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => caches.match("./index.html")))
  );
});
