import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/recording-test/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 4200,
    allowedHosts: ["kishore2ks.github.io", "localhost"],
  },
  build: { outDir: "docs" },
});
