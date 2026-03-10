export function env(key: string) {
  return process.env[key];
}

export function intEnv(key: string) {
  const stringValue = env(key);
  if (!stringValue) return null;
  const value = Number.parseInt(stringValue);
  if (Number.isNaN(value)) return null;
  return value;
}
