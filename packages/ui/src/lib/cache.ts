const CACHE = new Map<string, unknown>();
const PROMISE_CACHE = new Map<string, Promise<unknown>>();

export default async function cached<T>(
  key: string,
  provider: () => Promise<T>,
): Promise<T> {
  if (PROMISE_CACHE.has(key)) {
    return PROMISE_CACHE.get(key) as Promise<T>;
  }

  if (CACHE.has(key)) {
    return CACHE.get(key) as T;
  }

  const promise = provider();
  PROMISE_CACHE.set(key, promise);

  const result = await promise;
  CACHE.set(key, result);
  PROMISE_CACHE.delete(key);

  return result;
}
