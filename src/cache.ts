/**
 * Module-level in-memory cache for API responses.
 *
 * Survives tab switches (component unmount/remount) but is cleared on page
 * refresh. Components initialise their state from the cache so returning to
 * a tab shows data instantly, then refetch in the background to stay fresh.
 *
 * TTL is 5 minutes — after that the entry is treated as absent and the
 * component shows a spinner until the fresh fetch completes.
 */

const TTL_MS = 5 * 60 * 1000;

interface Entry<T> {
  data: T;
  ts: number;
}

const store = new Map<string, Entry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as Entry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() });
}

export function invalidate(key: string): void {
  store.delete(key);
}
