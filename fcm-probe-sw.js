self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PING') return;

  event.source?.postMessage({
    type: 'PONG',
    receivedAt: new Date().toISOString(),
    scope: self.registration.scope,
  });
});
