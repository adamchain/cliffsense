/* MyBenefitsPA service worker — Web Push handler.
 * Receives push messages and shows a notification; focuses/opens the app on click.
 * Intentionally minimal (no offline caching) so it can't serve stale app shells. */

self.addEventListener("install", () => {
  // Activate this worker immediately rather than waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "MyBenefitsPA", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "MyBenefitsPA";
  const options = {
    body: data.body || "",
    icon: "/mybenefitspa-icon.png",
    badge: "/mybenefitspa-icon.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/alerts" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/alerts";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus an existing window if one is open, otherwise open a new one.
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    }),
  );
});
