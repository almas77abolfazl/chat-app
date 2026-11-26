self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Chat App', body: event.data.text() };
  }

  const title = data.title || 'Chat App';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'chat-message',
    data: {
      chatId: data.chatId || '',
      url: data.chatId ? `/home?chatId=${encodeURIComponent(data.chatId)}` : '/home',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const chatId = event.notification?.data?.chatId || '';
  const targetUrl = event.notification?.data?.url || '/home';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (chatId) {
            client.postMessage({ type: 'OPEN_CHAT', chatId });
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
