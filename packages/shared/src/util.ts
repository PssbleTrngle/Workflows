import type { Dictionary } from "@pssbletrngle/workflows-types";

export function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function uniq<T>(values: T[]): T[] {
  return values.filter((v, i, a) => a.indexOf(v) === i);
}

export function mapKeys(
  from: Dictionary,
  mapper: (value: string) => string,
): Dictionary {
  return Object.fromEntries(
    Object.entries(from).map(([key, value]) => [mapper(key), value]),
  );
}
