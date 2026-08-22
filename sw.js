// 換名字才會清掉舊版快取
const CACHE_NAME = 'mycal-v9';

// 離線時至少要能開得起來，其餘檔案在第一次抓到時順手存起來
const OFFLINE_URLS = ['/mycal/', '/mycal/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => (name === CACHE_NAME ? null : caches.delete(name)))
      )
    )
  );
  self.clients.claim();
});

// 網路優先，離線才回快取。
// 關鍵是 cache: 'reload'：少了它，這裡的 fetch 會直接吃瀏覽器的 HTTP 快取
// （GitHub Pages 送 max-age=600），改版後手機會有十分鐘拿到的還是舊檔案。
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只管自己站上的 GET；Firebase 等外部請求原封不動放行，不要攔也不要存
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(request, { cache: 'reload' })
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
