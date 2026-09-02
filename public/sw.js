self.addEventListener("push", (event) => {
  const data = event.data
    ? event.data.json()
    : { title: "Warranty Vault", body: "You have a warranty update.", url: "/dashboard" };

  event.waitUntil(
    self.registration.showNotification(data.title || "Warranty Vault", {
      body: data.body || "",
      icon: "/brand/logo-mark.svg",
      badge: "/brand/logo-mark.svg",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(self.clients.openWindow(url));
});
