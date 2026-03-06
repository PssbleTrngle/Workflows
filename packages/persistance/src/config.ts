// TODO share?

function env(key: string) {
  return process.env[key];
}

function intEnv(key: string) {
  const stringValue = env(key);
  if (!stringValue) return null;
  const value = Number.parseInt(stringValue);
  if (Number.isNaN(value)) return null;
  return value;
}

export default {
  host: env("REDIS_HOST") ?? "localhost",
  port: intEnv("REDIS_PORT") ?? 6379,
};
