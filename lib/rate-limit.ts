const store = new Map<string, number[]>();

/**
 * Sliding window rate limiter (in-memory).
 * Возвращает true если запрос разрешён, false если лимит превышен.
 */
export function checkRateLimit(
  ip: string,
  limit = 20,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const timestamps = (store.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  store.set(ip, [...timestamps, now]);
  return true;
}
