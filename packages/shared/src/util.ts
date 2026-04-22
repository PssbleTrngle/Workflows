import type { Dictionary } from "@pssbletrngle/workflows-types";

export function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function uniq<T>(values: T[]): T[] {
  return values.filter((v, i, a) => a.indexOf(v) === i);
}

export function mapKeys(
  from: Dictionary,
  mapper: (key: string) => string,
): Dictionary {
  return Object.fromEntries(
    Object.entries(from).map(([key, value]) => [mapper(key), value]),
  );
}

export function mapValues<T, R>(
  from: Record<string, T>,
  mapper: (value: T, key: string) => R,
): Record<string, R> {
  return Object.fromEntries(
    Object.entries(from).map(([key, value]) => [key, mapper(value, key)]),
  );
}
