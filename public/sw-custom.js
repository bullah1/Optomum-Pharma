// Custom logic injected into VitePWA's service worker scope
// Push notification handling

self.addEventListener("push", (event) => {
  let data = { title: "Optimum Pharmaceuticals HLB", body: "নতুন আপডেট আছে!" };
  try {
    if (event.data) data = event.data.json();
  } catch { /* use default */ }

  const options = {
    body: data.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: data.tag || "optimumpharmahlb-notification",
    data: { link: data.link || "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title || "Optimum Pharmaceuticals HLB", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
