import { createLogger, format, transports } from "winston";
import config from "./config";

const logger = createLogger({
  level: config.log.level,
  format: format.json(),
  defaultMeta: { service: "workflows" },
  transports: [
    new transports.Console({
      format: format.simple(),
    }),
  ],
});

export default logger;
