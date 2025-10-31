import { Redis } from "ioredis";
import config from "./config";

const client = new Redis({
  host: config.redis.host,
  port: config.redis.port,
});

export default client;
