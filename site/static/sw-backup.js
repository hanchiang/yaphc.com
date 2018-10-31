const CACHE_NAME = 'site-cache';
const urlsToCache = [
  'img/icon-72x72.png',
  'img/icon-96x96.png',
  'img/icon-128x128.png',
  'img/icon-144x144.png',
  'img/icon-152x152.png',
  'img/icon-192x192.png',
  'img/icon-384x384.png',
  'img/icon-512x512.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-96x96.png',
  'favicon-128x128.png',
  'favicon-196x196.png',
];

/*
  It is important to note that while this event is happening, any previous version of your service worker 
  is still running and serving pages, so the things you do here must not disrupt that.
  For instance, this is not a good place to delete old caches, because the previous service worker may
  still be using them at this point.
*/
self.addEventListener('install', function (event) {
  // Perform install steps

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log(err)
      })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request);
      })
  );
});

// Gets triggered when old service worker is killed and new service worker is in control
self.addEventListener('activate', (event) => {

  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});