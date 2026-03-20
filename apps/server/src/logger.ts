import { addColors, createLogger, format, transports } from "winston";
import config from "./config";

addColors({
  error: "red",
  warn: "yellow",
  debug: "blue",
});

const logger = createLogger({
  level: config.log.level,
  format: format.json(),
  defaultMeta: { service: "workflows" },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize({ all: true }), format.simple()),
    }),
  ],
});

export default logger;
