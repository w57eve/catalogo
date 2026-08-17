// Service worker del catálogo — apertura instantánea en repetidas visitas.
// Shell cache-first; catalogo.json network-first (para ver novedades);
// imágenes (thumbs/full) cache-first.
const CACHE = "catalogo-v3";
const SHELL = ["./", "index.html", "manifest.webmanifest"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method!=="GET") return;
  const url = new URL(req.url);

  // catalogo.json: red primero, cae a caché
  if(url.pathname.endsWith("/datos/catalogo.json")){
    e.respondWith(
      fetch(req).then(r=>{ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); return r; })
                .catch(()=>caches.match(req)));
    return;
  }
  // imágenes: caché primero (rápido), y si no está, red y guardar
  if(/\/(thumbs|full)\//.test(url.pathname)){
    e.respondWith(caches.match(req).then(hit=>hit || fetch(req).then(r=>{
      const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); return r; })));
    return;
  }
  // resto (shell): caché primero
  e.respondWith(caches.match(req).then(hit=>hit || fetch(req)));
});
