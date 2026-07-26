self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming messages from the main thread (like Socket.io events when page is hidden)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, chatId } = event.data;
    const options = {
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: chatId || "general",
      renotify: true,
      data: { chatId },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Handle push notifications (for future Web Push integration)
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "New Message", body: event.data.text() };
    }
  }

  const title = data.title || "New message";
  const options = {
    body: data.body || "You have a new message",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: data.chatId || "general",
    renotify: true,
    data: { chatId: data.chatId },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const chatId = event.notification.data?.chatId;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const targetUrl = chatId ? `${self.location.origin}/?chatId=${chatId}` : `${self.location.origin}/`;

      // Look for an existing open window of our app
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin)) {
          if ("navigate" in client) {
            return client.navigate(targetUrl).then((navigatedClient) => {
              if (navigatedClient && "focus" in navigatedClient) {
                return navigatedClient.focus();
              }
            });
          } else {
            // Fallback to focus + postMessage
            return client.focus().then((focusedClient) => {
              if (chatId) {
                focusedClient.postMessage({ type: "SELECT_CHAT", chatId });
              }
            });
          }
        }
      }
      // If no window is open, open a new one with deep link search query
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
