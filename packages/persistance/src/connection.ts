import type { Logger } from "@pssbletrngle/workflows-types/logger";
import mongoose from "mongoose";
import config from "./config";

const { host, port, user, pass, database } = config;

export async function connectDatabase(logger: Logger) {
  const url = `mongodb://${user}:${pass}@${host}:${port}/${database}`;

  logger.debug("connecting to MongoDB", { url });

  // TODO check authSource
  await mongoose.connect(url, {
    authSource: "admin",
  });
}
