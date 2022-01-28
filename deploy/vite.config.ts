import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: "./src/main.ts",
      name: "ExampleSmolFrontend",
      fileName: (format) => `deploy-cloudflare.${format}.js`,
    },
    rollupOptions: {
      external: ["node-fetch", "fs/promises"],
    },
  },
});
