import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "pwa-192x192.png", "pwa-512x512.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/],
        offlineGoogleAnalytics: false,
        importScripts: ["/sw-custom.js"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/pjlygfpltmkbvmkenfku\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /\/fonts\/.*\.woff2$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "local-fonts",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: "Optimum Pharmaceuticals HLB — Online Pharmacy & Healthcare",
        short_name: "Optimum HLB",
        description: "Order genuine medicines online with fast home delivery. Bangladesh's trusted e-pharmacy.",
        theme_color: "#F8931D",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/?utm_source=pwa",
        id: "/",
        lang: "en",
        dir: "ltr",
        categories: ["health", "medical", "shopping"],
        prefer_related_applications: false,
        shortcuts: [
          {
            name: "Order Medicines",
            short_name: "Order",
            url: "/category/all?utm_source=pwa_shortcut",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Book Lab Test",
            short_name: "Lab Test",
            url: "/lab-test?utm_source=pwa_shortcut",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Upload Prescription",
            short_name: "Prescription",
            url: "/prescription-upload?utm_source=pwa_shortcut",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
        screenshots: [
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "Optimum Pharmaceuticals HLB Home Screen",
          },
        ],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tooltip", "@radix-ui/react-popover"],
          "vendor-carousel": ["embla-carousel-react", "embla-carousel-autoplay"],
          "vendor-form": ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
  },
}));
