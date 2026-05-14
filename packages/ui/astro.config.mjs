// @ts-check
import node from "@astrojs/node";
import { defineConfig } from "astro/config";
import htmx from "./plugins/htmx";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [htmx],
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
      allowedHosts: [".workflows.somethingcatchy.net"],
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
