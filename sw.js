/* sw.js — put at site root (e.g. https://yourdomain.com/sw.js)
 *
 * - Update CACHE_NAME and ASSETS to match files you want cached.
 * - Ensure this file is served over HTTPS and at root so its scope covers the site.
 * - If using PushAlert (third-party push provider), confirm they don't require their own SW.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `helalink-cache-${CACHE_VERSION}`;
const ASSETS = [
  '/',                     // index
  '/index.html',
  '/styles.css',
  '/main.js',
  '/favicon.ico',
  '/logo.png'
  // add other assets you want available offline
];

/* Install: cache app shell */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        // still allow install to finish (optional)
        console.warn('SW install: cache failed', err);
      })
  );
});

/* Activate: cleanup old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/* Fetch: cache-first for assets, network-first for navigation/API (simple heuristic) */
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only deal with GET requests here
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Prefer cache for same-origin static assets
  if (ASSETS.includes(url.pathname) || url.origin === location.origin && url.pathname.startsWith('/assets')) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        // update cache in background
        caches.open(CACHE_NAME).then(cache => {
          if (res && res.status === 200) cache.put(req, res.clone());
        });
        return res.clone();
      }).catch(()=>caches.match('/index.html'))) // fallback
    );
    return;
  }

  // For navigation requests (HTML) and API endpoints, try network first then cache
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).then(res => {
        // optionally update cache
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // Default: try cache, then network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => res))
  );
});

/* PUSH event: show notification */
/* Expected payload (recommended) JSON:
   {
     "title": "New update",
     "body": "Click to see details",
     "icon": "/logo.png",
     "badge": "/badge.png",
     "url": "https://yourdomain.com/some-page",
     "tag": "updates",
     "actions": [
        { "action": "open", "title": "Open" },
        { "action": "dismiss", "title": "Dismiss" }
     ]
   }
*/
self.addEventListener('push', event => {
  // If payload was sent, try to parse JSON, otherwise fallback to text
  let payload = {};
  try {
    if (event.data) {
      const text = event.data.text();
      // try JSON parse, but not required
      try { payload = JSON.parse(text); } catch (e) { payload = { body: text }; }
    }
  } catch (err) {
    console.warn('SW push: could not parse event.data', err);
    payload = { body: 'You have a new notification.' };
  }

  // Defaults
  const title = payload.title || 'Helalink';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/favicon.ico',
    tag: payload.tag || 'helalink-notification',
    data: {
      url: payload.url || '/',        // used in notificationclick
      ...payload.data                 // any other custom data
    },
    actions: Array.isArray(payload.actions) ? payload.actions : []
  };

  // Show notification
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/* Notification click: focus/open client, handle actions */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const clickAction = event.action; // empty string if primary notification body was clicked
  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  // Analytics or action handling (optional)
  // Example: if action === 'dismiss' just exit
  if (clickAction === 'dismiss') {
    return;
  }

  // Focus existing client or open new window/tab
  event.waitUntil((async () => {
    try {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      // If a tab is already open with same origin, focus it and navigate if needed
      for (const client of allClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === location.origin) {
          // focus and navigate
          client.focus();
          // optionally navigate the client to the URL
          if (targetUrl && clientUrl.pathname !== new URL(targetUrl, location.origin).pathname) {
            client.postMessage({ type: 'navigate', url: targetUrl });
          }
          return;
        }
      }
      // Otherwise, open a new window
      await clients.openWindow(targetUrl);
    } catch (err) {
      console.error('SW notificationclick error', err);
    }
  })());
});

/* Notification close: optional hook (e.g. analytics) */
self.addEventListener('notificationclose', event => {
  // You could send analytics to your endpoint if needed
  // fetch('/analytics/notification-closed', { method:'POST', body: JSON.stringify({tag: event.notification.tag}) })
});

/* Push subscription change (e.g. browser refreshed or keys rotated)
   Best practice: notify open pages to re-subscribe and send subscription to server.
*/
self.addEventListener('pushsubscriptionchange', event => {
  console.info('SW: pushsubscriptionchange', event);
  event.waitUntil((async () => {
    // Notify clients to re-subscribe
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    for (const client of allClients) {
      client.postMessage({ type: 'resubscribe' });
    }
  })());
});
