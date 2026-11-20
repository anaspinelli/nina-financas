// Nina Finanças: guarda o app no celular para abrir mesmo sem internet.
const CACHE = 'nina-v4.2';
const ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Página: tenta a internet primeiro (para pegar atualizações) e usa a cópia se estiver offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // Demais arquivos (ícones, fontes): usa a cópia e atualiza por trás.
  e.respondWith(caches.match(req).then(hit => {
    const rede = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return r; }).catch(() => hit);
    return hit || rede;
  }));
});
