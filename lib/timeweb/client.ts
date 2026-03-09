const BASE_V1 = "https://api.timeweb.cloud/api/v1";
const BASE_V2 = "https://api.timeweb.cloud/api/v2";

// Коды ошибок, при которых стоит повторить запрос
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 600;

export function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {},
  version: "v1" | "v2" = "v1"
): Promise<T> {
  const base = version === "v2" ? BASE_V2 : BASE_V1;
  // Retry делаем только для read-only запросов, чтобы избежать дублей
  const isReadOnly = !options.method || options.method === "GET";
  const maxAttempts = isReadOnly ? RETRY_ATTEMPTS : 1;

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }

    const res = await fetch(`${base}${path}`, {
      ...options,
      headers: { ...getHeaders(token), ...options.headers },
    });

    if (!res.ok) {
      if (RETRYABLE_STATUSES.has(res.status) && attempt < maxAttempts - 1) {
        lastError = new Error(`evolvin.cloud API error ${res.status}: ${res.statusText}`);
        continue;
      }
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(
        `evolvin.cloud API error ${res.status}: ${error.message || JSON.stringify(error)}`
      );
    }

    if (res.status === 204) return null as T;
    return res.json();
  }

  throw lastError;
}
