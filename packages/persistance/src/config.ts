import { env, intEnv } from "@pssbletrngle/workflows-shared/config";

export default {
  host: env("MONGO_HOST") ?? "127.0.0.1",
  port: intEnv("MONGO_PORT") ?? 27017,
  user: env("MONGO_USER") ?? "workflows",
  pass: env("MONGO_PASS") ?? "workflows",
  database: env("MONGO_DB") ?? "workflows",
  authSource: env("MONGO_AUTH_SOURCE") ?? "admin",
};
