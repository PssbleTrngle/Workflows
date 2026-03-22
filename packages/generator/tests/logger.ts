import type { Options } from "../src";

const testLogger: Options["logger"] = {
  info: () => {},
  debug: () => {},
  warn: () => {},
  error: () => {},
};

export default testLogger;
