import { version } from "@pssbletrngle/github-meta-generator/meta";
import { createLogger, format, transports } from "winston";
import config from "./config";

const logger = createLogger({
  level: config.log.level,
  format: format.json(),
  defaultMeta: { service: "workflows", version },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize({ all: true }), format.simple()),
    }),
  ],
});

export default logger;
