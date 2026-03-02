import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      components: path.resolve(__dirname, "src/components"),
      modules: path.resolve(__dirname, "src/modules"),
      pages: path.resolve(__dirname, "src/pages"),
      services: path.resolve(__dirname, "src/services"),
      providers: path.resolve(__dirname, "src/providers"),
      assets: path.resolve(__dirname, "src/assets"),
    },
  },
  server: {
    port: 3002,
  },
});
