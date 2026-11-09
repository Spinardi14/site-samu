// Service worker do Portal SAMU (app instalável).
// Páginas: sempre busca a versão nova na internet; sem conexão, abre a última
// versão salva. Chamadas à API e a outros sites nunca passam por aqui.
const CACHE = "samu-portal-v1";
const BASICO = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(BASICO)).catch(() => {}));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // API, imagens externas etc.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => { const copia = res.clone(); caches.open(CACHE).then((c) => c.put("/", copia)).catch(() => {}); return res; })
        .catch(() => caches.match("/").then((r) => r || Response.error())),
    );
    return;
  }
  if (BASICO.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((r) => r || fetch(req)));
  }
});
