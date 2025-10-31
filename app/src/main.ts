import { configSchema } from "@pssbletrngle/github-meta-generator";
import express from "express";
import config from "./config";
import { devMiddlware } from "./dev";
import { cutoff, errorHandler } from "./error";
import metadataMiddleware from "./metadata";

const server = express();

server.use(express.text({ type: "*/*" }));

if (process.env.NODE_ENV === "development") {
  console.info("Installing dev middleware");
  server.use(devMiddlware);
}

server.get("/schema/config.json", (_, response) => {
  response.json(configSchema);
});

server.use("/metadata", metadataMiddleware);

server.use(cutoff);
server.use(errorHandler);

server.listen(config.server.port, () => {
  console.info(`Server running at ${config.server.port}`);
  console.info();
});
