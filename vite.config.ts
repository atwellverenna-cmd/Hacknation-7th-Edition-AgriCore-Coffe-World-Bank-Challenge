// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        // Registration is owned by src/lib/pwa-register.ts — never auto-inject.
        injectRegister: null,
        registerType: "autoUpdate",
        devOptions: { enabled: false },
        filename: "sw.js",
        manifest: {
          name: "Kopi — Coffee Leaf Checker",
          short_name: "Kopi",
          description:
            "Offline-first coffee leaf diagnosis for smallholder farmers. Check a leaf, get trusted advice — no signal needed.",
          theme_color: "#5b8def",
          background_color: "#e9f1ff",
          display: "standalone",
          start_url: "/",
          icons: [
            { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Navigations: network first, fall back to cache when offline.
          // No navigateFallback — this app is SSR'd (no static index.html);
          // visited pages are cached by the NetworkFirst rule below.
          navigateFallbackDenylist: [/^\/~oauth/],
          runtimeCaching: [
            {
              urlPattern: ({ request }: { request: Request }) =>
                request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "pages" },
            },
            {
              urlPattern: ({ url }: { url: URL }) => url.origin === self.location.origin,
              handler: "CacheFirst",
              options: { cacheName: "static-assets" },
            },
          ],
        },
      }),
    ],
  },
});
