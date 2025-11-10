import { Redis } from "ioredis";
import config from "./config";

const { host, port } = config.redis;

const client = new Redis({
  host,
  port,
  retryStrategy: (times) => {
    const millis = Math.min(10, times) * 1000;
    console.warn(
      `could not connect to redis at ${host}:${port}, retrying in ${millis}ms...`
    );
    return millis;
  },
});

export default client;
