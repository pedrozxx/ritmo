/* Offline do Ritmo. Cache de runtime: não precisa saber o nome dos arquivos
   que o Vite gera com hash. Navegação busca a rede primeiro (pra atualização
   chegar), o resto é cache primeiro (pra abrir rápido e sem internet). */
const CACHE = 'ritmo-v2';

self.addEventListener('install', () => self.skipWaiting());
/* cache de versão antiga sai: cada deploy deixava o bundle anterior lá dentro */
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('ritmo-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()),
));

/* Só guarda resposta boa. Um 404 passageiro no meio de um deploy ficava
   guardado e, como o resto é cache primeiro, servido pra sempre. A resposta
   opaca (fonte de outro domínio) não diz o status, então entra. */
const guardar = (req, res) => {
  if (res.ok || res.type === 'opaque') {
    const copia = res.clone();
    caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => guardar(req, res))
        // sem rede: devolve a página guardada, ou a raiz do app (que não é
        // necessariamente "/" — no GitHub Pages o escopo é /ritmo/)
        .catch(() => caches.match(req).then(m => m || caches.match(self.registration.scope)))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(m => m || fetch(req).then(res => guardar(req, res)))
  );
});
