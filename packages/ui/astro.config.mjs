// @ts-check
import node from "@astrojs/node";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "middleware",
  }),
  vite: {
    server: {
      hmr: {
        host: "localhost",
        protocol: "ws",
        clientPort: 4321,
      },
      allowedHosts: ["webhooks.new.macarena.ceo"],
      proxy: {
        "/metadata/api": {
          target: "http://localhost:8888",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      sourcemap: "hidden",
    },
  },
});
