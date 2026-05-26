/**
 * sessionStorage-backed cache for API responses.
 *
 * Survives tab switches AND page refreshes. Cleared automatically by the
 * browser when the tab is closed, so there's no stale data on the next session.
 *
 * TTL is 5 minutes — after that the entry is treated as absent and the
 * component shows a spinner until the fresh fetch completes.
 */

const TTL_MS = 5 * 60 * 1000;
const PREFIX = "pulse_cache:";

interface Entry<T> {
  data: T;
  ts: number;
}

export function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry: Entry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > TTL_MS) {
      sessionStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // sessionStorage can throw if storage quota is exceeded — fail silently.
  }
}

export function invalidate(key: string): void {
  sessionStorage.removeItem(PREFIX + key);
}
