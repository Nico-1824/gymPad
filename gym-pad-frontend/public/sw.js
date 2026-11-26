// GymPad service worker.
// Needed so the app can show notifications (required on iPhone and Android).
// It does not cache anything, so deploys always show the latest version.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Tapping a notification brings the app to the front (or opens it).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (windows.length > 0) return windows[0].focus()
      return self.clients.openWindow('/')
    })(),
  )
})
