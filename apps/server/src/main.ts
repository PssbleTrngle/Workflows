import { configSchema } from "@pssbletrngle/github-meta-generator";
import express from "express";
import { createNodeMiddleware } from "octokit";
import app from "./app";
import config from "./config";
import { cutoff, errorHandler } from "./error";
import logger from "./logger";
import { createMetadataMiddleware } from "./metadata";

const server = express();

server.use((request, _, next) => {
  logger.debug(`${request.method} -> ${request.originalUrl}`);
  return next();
});

if (config.dev) {
  logger.info("Installing dev middleware");
  const { createDevMiddleware } = await import("./dev");
  server.use(await createDevMiddleware());
}

server.get("/schema/config.json", (_, response) => {
  response.json(configSchema);
});

server.get("/status", (_, response) => {
  response.json({ running: true });
});

server.use(createNodeMiddleware(app));
server.use(await createMetadataMiddleware(app));

server.use(cutoff);
server.use(errorHandler);

server.listen(config.server.port, () => {
  logger.info(`Server running at ${config.server.port}`);
});
