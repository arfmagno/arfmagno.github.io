// Adds cross-origin isolation headers to the portfolio and to the Hiyas demo
// when it's embedded in the phone frame. The demo keeps its data in SQLite in
// the browser, and that needs an isolated page. GitHub Pages can't send these
// headers, so this worker adds them. Other project paths are left untouched.
const OWN = /^\/(index\.html|app\.js|style\.css|assets\/.*|jewelry-mgt-mobile-app\/.*)?$/
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin || !OWN.test(url.pathname)) return
  if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') return
  e.respondWith(fetch(e.request).then((r) => {
    if (r.status === 0) return r
    const h = new Headers(r.headers)
    h.set('Cross-Origin-Embedder-Policy', 'credentialless')
    h.set('Cross-Origin-Opener-Policy', 'same-origin')
    h.set('Cross-Origin-Resource-Policy', 'same-origin')
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h })
  }))
})
