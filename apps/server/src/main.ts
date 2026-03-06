import { configSchema } from "@pssbletrngle/github-meta-generator";
import express from "express";
import { createNodeMiddleware } from "octokit";
import app from "./app";
import config from "./config";
import { cutoff, errorHandler } from "./error";
import { createMetadataMiddleware } from "./metadata";

const server = express();

if (config.dev) {
  console.info("Installing dev middleware");
  const { createDevMiddleware } = await import("./dev");
  server.use(await createDevMiddleware());
}

server.get("/schema/config.json", (_, response) => {
  response.json(configSchema);
});

server.use(createNodeMiddleware(app));
server.use("/metadata", await createMetadataMiddleware(app));

server.use(cutoff);
server.use(errorHandler);

server.listen(config.server.port, () => {
  console.info(`Server running at ${config.server.port}`);
  console.info();
});
