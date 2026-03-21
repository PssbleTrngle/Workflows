export function env(key: string) {
  return process.env[key];
}

export function requireEnv(key: string) {
  const value = env(key);
  if (value) return value;
  throw new Error(`environment variable '${key}' missing`);
}

export function intEnv(key: string) {
  const stringValue = env(key);
  if (!stringValue) return null;
  const value = Number.parseInt(stringValue);
  if (Number.isNaN(value)) return null;
  return value;
}

export function boolEnv(key: string) {
  const stringValue = env(key);
  if (!stringValue) return null;
  return Boolean(key);
}

export async function requireFile(path: string) {
  const file = Bun.file(path);
  if (await file.exists()) {
    return file.text();
  }
  throw new Error(`Could not locate file at ${path}`);
}
