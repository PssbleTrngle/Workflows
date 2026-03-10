import { env, intEnv } from "@pssbletrngle/workflows-shared/config";

export default {
  host: env("REDIS_HOST") ?? "localhost",
  port: intEnv("REDIS_PORT") ?? 6379,
};
