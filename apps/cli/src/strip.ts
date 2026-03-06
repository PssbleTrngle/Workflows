function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

type O = Record<string, unknown>;

export default function strip(values: O, reference?: O, defaults?: O): O {
  if (!reference) return {};

  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return [
            key,
            strip(value as O, reference[key] as O, defaults?.[key] as O),
          ];
        }

        if (defaults?.[key] === value) return null;
        if (key in reference) return [key, value];

        return null;
      })
      .filter(notNull),
  );
}
