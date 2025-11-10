const dev = process.env.NODE_ENV !== "production";

if (dev) {
  const dotenv = await import("dotenv");
  dotenv.config({ path: [".env.dev", ".env.local"] });
}

function env(key: string) {
  return process.env[key];
}

function requireEnv(key: string) {
  const value = env(key);
  if (value) return value;
  throw new Error(`environment variable '${key}' missing`);
}

function intEnv(key: string) {
  const stringValue = env(key);
  if (!stringValue) return null;
  const value = Number.parseInt(stringValue);
  if (Number.isNaN(value)) return null;
  return value;
}

async function requireFile(path: string) {
  const file = Bun.file(path);
  if (await file.exists()) {
    return file.text();
  }
  throw new Error(`Could not locate file at ${path}`);
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
};
