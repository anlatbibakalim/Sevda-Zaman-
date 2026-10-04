// İslam Dünyası servis çalışanı - önce ağ, olmazsa önbellek (güncellemeler hemen gelir)
const CACHE = 'islam-dunyasi-v2';
const DOSYALAR = ['./', './index.html', './style.css', './app.js', './manifest.json'];

self.addEventListener('install', function (e) {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(DOSYALAR); }).catch(function () {}));
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys()
            .then(function (anahtarlar) {
                return Promise.all(anahtarlar.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
            })
            .then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (e) {
    const istek = e.request;
    if (istek.method !== 'GET' || new URL(istek.url).origin !== self.location.origin) return;
    e.respondWith(
        fetch(istek).then(function (yanit) {
            const kopya = yanit.clone();
            caches.open(CACHE).then(function (c) { c.put(istek, kopya); });
            return yanit;
        }).catch(function () {
            return caches.match(istek).then(function (k) { return k || caches.match('./index.html'); });
        })
    );
});
