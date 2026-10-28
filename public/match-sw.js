/*
 * Match's service worker, registered only on match.onedeck.africa.
 *
 * It does two things: shows "someone's free" pings when they arrive, and
 * opens (or focuses) Match when one is tapped. It caches nothing — Match is
 * live or it is nothing — but its fetch handler lets the app be installed.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Match', {
      body: data.body || 'Someone is on Match right now.',
      icon: '/match-icon-192.png',
      badge: '/match-icon-192.png',
      tag: 'match-free',
      renotify: true,
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});

self.addEventListener('fetch', () => {
  /* Network only: nothing is cached. */
});
