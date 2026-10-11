/*
 * Service worker mínimo: guarda o aplicativo e os dados em cache para
 * funcionar offline e em conexão fraca (3G). Estratégia:
 * - navegações: rede primeiro, cache como reserva;
 * - demais arquivos: cache primeiro, atualizando em segundo plano.
 * Versão bump: altere o nome do cache ao publicar uma nova versão.
 */
const CACHE = "compara-plano-v1";

self.addEventListener("install", (evento) => {
  self.skipWaiting();
  evento.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(["./", "./index.html", "./manifest.webmanifest", "./icon.svg"])
    )
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== "GET" || !requisicao.url.startsWith(self.location.origin)) return;

  if (requisicao.mode === "navigate") {
    evento.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(requisicao, copia));
          return resposta;
        })
        .catch(() => caches.match(requisicao).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  evento.respondWith(
    caches.match(requisicao).then((cacheado) => {
      const rede = fetch(requisicao)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(requisicao, copia));
          }
          return resposta;
        })
        .catch(() => cacheado);
      return cacheado || rede;
    })
  );
});
