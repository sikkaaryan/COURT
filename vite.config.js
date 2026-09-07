import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.svg",
        "pwa-192.svg",
        "pwa-512.svg"
      ],

      manifest: {
        name: "Clutch",
        short_name: "Clutch",
        description: "Your custom basketball-inspired music console.",
        theme_color: "#050505",
        background_color: "#050505",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/pwa-192.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "/pwa-512.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      },

      workbox: {
        navigateFallback: "/index.html"
      }
    })
  ],

  server: {
    host: true,
    port: 5173
  },

  build: {
    outDir: "dist",
    sourcemap: false
  }
});
