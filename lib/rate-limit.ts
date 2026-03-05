const store = new Map<string, number[]>();

// Очищаем устаревшие записи каждые 5 минут, чтобы не копилась память
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of store.entries()) {
    const fresh = timestamps.filter((t) => now - t < 60_000);
    if (fresh.length === 0) store.delete(ip);
    else store.set(ip, fresh);
  }
}, 5 * 60_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Секунд до сброса окна; 0 если запрос разрешён */
  retryAfter: number;
}

/**
 * Sliding window rate limiter (in-memory).
 * Возвращает объект с флагом разрешения и данными для заголовков.
 */
export function checkRateLimit(
  ip: string,
  limit = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const timestamps = (store.get(ip) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const oldest = Math.min(...timestamps);
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  store.set(ip, [...timestamps, now]);
  return { allowed: true, remaining: limit - timestamps.length - 1, retryAfter: 0 };
}
