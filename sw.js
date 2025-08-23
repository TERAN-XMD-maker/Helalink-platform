// sw.js - service worker (place at root of frontend site)
self.addEventListener('push', function(event) {
  let data = { title: 'Helalink', body: 'Launch reminder!', icon: '/icon.png', url: '/' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) { /* ignore parse errors */ }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.png',
    badge: data.badge || '/icon.png',
    data: data.url || '/'
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const openUrl = event.notification.data || '/';
  event.waitUntil(clients.openWindow(openUrl));
});
