export function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function uniq<T>(values: T[]): T[] {
  return values.filter((v, i, a) => a.indexOf(v) === i);
}
