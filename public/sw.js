self.addEventListener('install', (event) => {
  // Activate immediately after installation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Minimal fetch handler to mark that we handle network requests.
// We are not doing any custom caching yet, just letting requests pass through.
self.addEventListener('fetch', () => {
  // Intentionally empty: this service worker currently does not modify requests or responses.
});

