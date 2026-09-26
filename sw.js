const VERSION = "dexterous-v2";
const SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./style.css",
  "./config.js",
  "./lib/data.js",
  "./lib/store.js",
  "./data/catalog.json",
  "./assets/icon.svg",
  "./assets/logo.svg",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.pathname.includes("/api/")) return;
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((c) => c.put(event.request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then(
              (r) =>
                r ||
                (event.request.mode === "navigate"
                  ? caches.match("./index.html")
                  : Response.error()),
            ),
        ),
    );
  } else if (
    url.hostname === "raw.githubusercontent.com" ||
    url.hostname === "pokeapi.co"
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(VERSION).then(async (c) => {
                const keys = await c.keys();
                if (keys.length < 650) c.put(event.request, copy);
              });
            }
            return response;
          }),
      ),
    );
  }
});
