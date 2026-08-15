/* ============================================================
   WT Satisfação PDV — sw.js (Service Worker do Dashboard)
   Versão: 1.0 | Agosto 2026

   O QUE FAZ:
   - Permite instalar o dashboard como app no celular
   - Guarda a "casca" do dashboard (HTML, ícones, gráficos) para abrir
     rápido e funcionar mesmo sem internet
   - NÃO mexe no formulário (index.html / poty): esses pedidos passam
     direto para a rede, sem cache

   IMPORTANTE:
   Ao mudar o dashboard.html, suba o número da versão abaixo (v1 -> v2).
   Isso força o celular a baixar a versão nova.
   ============================================================ */

const VERSAO = 'wt-dash-v1';
const CACHE_CASCA = `${VERSAO}-casca`;

// Arquivos da "casca" do app
const CASCA = [
  '/dashboard.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon-180.png',
  '/icons/favicon-32.png'
];

// Bibliotecas externas (CDN) que o dashboard usa
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Dominios cujo conteudo pode ficar em cache (fonte + bibliotecas)
const DOMINIOS_CACHE = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// ---------- instalacao ----------
self.addEventListener('install', evento => {
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE_CASCA);
    // um a um: se um item falhar, os outros continuam
    await Promise.all(
      [...CASCA, ...CDN].map(url =>
        cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
      )
    );
    self.skipWaiting();
  })());
});

// ---------- ativacao: limpa versoes antigas ----------
self.addEventListener('activate', evento => {
  evento.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(
      nomes.filter(n => !n.startsWith(VERSAO)).map(n => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

// ---------- mensagens vindas da pagina ----------
self.addEventListener('message', evento => {
  if (evento.data === 'atualizar-agora') self.skipWaiting();
});

// ---------- estrategias ----------

// rede primeiro, cache como reserva (usado no HTML do dashboard)
async function redePrimeiro(request) {
  const cache = await caches.open(CACHE_CASCA);
  try {
    const resposta = await fetch(request);
    if (resposta && resposta.ok && !resposta.redirected) {
      cache.put('/dashboard.html', resposta.clone()).catch(() => {});
    }
    return resposta;
  } catch (e) {
    const guardado = await cache.match('/dashboard.html');
    if (guardado) return guardado;
    throw e;
  }
}

// cache primeiro, atualizando em segundo plano (icones, libs, fontes)
async function cachePrimeiro(request) {
  const cache = await caches.open(CACHE_CASCA);
  const guardado = await cache.match(request);
  const rede = fetch(request)
    .then(resposta => {
      if (resposta && (resposta.ok || resposta.type === 'opaque') && !resposta.redirected) {
        cache.put(request, resposta.clone()).catch(() => {});
      }
      return resposta;
    })
    .catch(() => null);
  return guardado || (await rede) || Response.error();
}

// ---------- roteamento ----------
self.addEventListener('fetch', evento => {
  const req = evento.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // dados do Firestore: sempre da rede, nunca do cache
  if (url.hostname.endsWith('firestore.googleapis.com')) return;

  // abrir o app (navegacao dentro do dashboard)
  if (req.mode === 'navigate') {
    if (url.origin === self.location.origin && url.pathname.startsWith('/dashboard')) {
      evento.respondWith(redePrimeiro(req));
    }
    return; // formulario e demais paginas: passam direto
  }

  // arquivos da casca (mesmo dominio)
  if (url.origin === self.location.origin) {
    if (CASCA.includes(url.pathname)) evento.respondWith(cachePrimeiro(req));
    return;
  }

  // bibliotecas e fontes externas
  if (DOMINIOS_CACHE.includes(url.hostname)) {
    evento.respondWith(cachePrimeiro(req));
  }
});
