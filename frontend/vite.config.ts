import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// Site servido na raiz de https://knowledge-nexus.github.io (repositório <owner>.github.io).
// Em desenvolvimento o Vite injecta scripts inline (HMR), incompatíveis com a CSP estrita
// do site publicado; a CSP só é removida no servidor de desenvolvimento.
const devWithoutCsp: Plugin = {
  name: "nexus-dev-without-csp",
  apply: "serve",
  transformIndexHtml: (html) => html.replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*>/s, ""),
};

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), devWithoutCsp],
  optimizeDeps: { exclude: ["@sqlite.org/sqlite-wasm"] },
  server: { fs: { allow: [".."] } },
  build: { target: "es2022", sourcemap: false, chunkSizeWarningLimit: 2000 },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    testTimeout: 20000,
  },
});
