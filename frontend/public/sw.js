const CACHE_VERSION = "almanac-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const PRECACHE_URLS = [
  "/",
  "/notes",
  "/search",
  "/courses",
  "/interview",
  "/dashboard",
  "/updates",
  "/about",
  "/offline",
  "/icons/almanac-logo.png",
];

// 1. Install & Precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// 2. Allow user-prompted skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 3. Activate & Evict Stale Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 4. Fetch Strategy: Network-First for Navigation, Cache-First for Static Assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API routes from SW intercept
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  event.respondWith(cacheFirstAsset(request));
});

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (await caches.match("/offline")) ||
      Response.error()
    );
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || Response.error();
  }
}

// 5. Push Notifications for Daily Notes
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "📚 New Almanac Note";
  const options = {
    body: data.body || "A new engineering note has been published.",
    icon: "/icons/almanac-logo.png",
    badge: "/icons/almanac-logo.png",
    data: {
      url: data.url || "/notes",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 6. Notification Click Navigation
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/notes";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
