import {
  boolEnv,
  env,
  intEnv,
  requireEnv,
  requireFile,
} from "@pssbletrngle/workflows-shared/config";

const dev = process.env.NODE_ENV !== "production";

if (dev) {
  const dotenv = await import("dotenv");
  dotenv.config({ path: [".env.dev", ".env.local"] });
}

export default {
  dev,
  app: {
    id: requireEnv("GITHUB_APP_ID"),
    privateKey: await requireFile(requireEnv("GITHUB_APP_PRIVATE_KEY_FILE")),
    oauth: {
      clientId: requireEnv("GITHUB_OAUTH_CLIENT_ID"),
      clientSecret: requireEnv("GITHUB_OAUTH_CLIENT_SECRET"),
    },
  },
  webhooks: {
    secret: requireEnv("WEBHOOK_SECRET"),
  },
  server: {
    port: intEnv("PORT") ?? 8080,
  },
  git: {
    cloneDir: requireEnv("GIT_CLONE_DIR"),
  },
  redis: {
    host: env("REDIS_HOST") ?? "localhost",
    port: intEnv("REDIS_PORT") ?? 6379,
  },
  log: {
    level: env("LOG_LEVEL") ?? "info",
  },
  startupCheck: boolEnv("STARTUP_CHECKS") ?? true,
};
