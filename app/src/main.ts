import { configSchema } from "@pssbletrngle/github-meta-generator";
import express from "express";
import config from "./config";
import { ApiError, errorHandler } from "./error";
import githubMiddleware from "./github";
import { devMiddlware } from "./security";

const server = express();

server.use(express.text({ type: "*/*" }));

if (process.env.NODE_ENV === "development") {
  console.info("Installing dev middleware");
  server.use(devMiddlware);
}

server.get("/schema/config.json", (_, response) => {
  response.json(configSchema);
});

server.use("/metadata", githubMiddleware);

server.use((req) => {
  throw new ApiError(`cannot call ${req.method} on ${req.path}`, 404);
});

server.use(errorHandler);

server.listen(config.server.port, () => {
  console.info(`Server running at ${config.server.port}`);
  console.info();
});
