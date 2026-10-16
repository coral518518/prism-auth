import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [cloudflare(), react()],
  server: {
    allowedHosts: ["vite.krnl64.win"],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            manualChunks(id) {
              if (id.includes("node_modules")) {
                if (
                  id.includes("react-dom") ||
                  id.includes("react/") ||
                  id.includes("react-router")
                ) {
                  return "vendor-react";
                }
                if (id.includes("@fluentui/react-icons")) {
                  return "vendor-fluent-icons";
                }
                if (id.includes("@fluentui") || id.includes("@griffel")) {
                  return "vendor-fluent";
                }
                if (id.includes("@tanstack")) {
                  return "vendor-query";
                }
                if (id.includes("i18next")) {
                  return "vendor-i18n";
                }
              }
            },
          },
        },
  },
}));
