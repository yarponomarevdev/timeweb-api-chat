import type {
  TimewebServer,
  TimewebPreset,
  TimewebOS,
  TimewebFinances,
  TimewebCreateServerParams,
  ServerAction,
} from "@/types/timeweb";

const BASE = "https://api.timeweb.cloud/api/v1";

// Коды ошибок, при которых стоит повторить запрос
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 600;

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  // Retry делаем только для read-only запросов, чтобы избежать дублей
  const isReadOnly = !options.method || options.method === "GET";
  const maxAttempts = isReadOnly ? RETRY_ATTEMPTS : 1;

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }

    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...getHeaders(token), ...options.headers },
    });

    if (!res.ok) {
      if (RETRYABLE_STATUSES.has(res.status) && attempt < maxAttempts - 1) {
        lastError = new Error(`Timeweb API error ${res.status}: ${res.statusText}`);
        continue;
      }
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(
        `Timeweb API error ${res.status}: ${error.message || JSON.stringify(error)}`
      );
    }

    if (res.status === 204) return null as T;
    return res.json();
  }

  throw lastError;
}

export async function listServers(token: string): Promise<TimewebServer[]> {
  const data = await apiRequest<{ servers: TimewebServer[] }>("/servers", token);
  return data.servers ?? [];
}

export async function getServer(token: string, id: number): Promise<TimewebServer> {
  const data = await apiRequest<{ server: TimewebServer }>(`/servers/${id}`, token);
  return data.server;
}

export async function createServer(
  token: string,
  params: TimewebCreateServerParams
): Promise<TimewebServer> {
  const data = await apiRequest<{ server: TimewebServer }>("/servers", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.server;
}

export async function deleteServer(token: string, id: number): Promise<{ action_fields: Record<string, string> } | null> {
  return apiRequest(`/servers/${id}`, token, { method: "DELETE" });
}

export async function serverAction(
  token: string,
  id: number,
  action: ServerAction
): Promise<{ action: string; result: boolean }> {
  return apiRequest(`/servers/${id}/action`, token, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export async function listPresets(token: string): Promise<TimewebPreset[]> {
  const data = await apiRequest<{ server_presets: TimewebPreset[] }>(
    "/presets/servers",
    token
  );
  return data.server_presets ?? [];
}

export async function listOS(token: string): Promise<TimewebOS[]> {
  const data = await apiRequest<{ servers_os: TimewebOS[] }>("/os/servers", token);
  return data.servers_os ?? [];
}

export async function getBalance(token: string): Promise<TimewebFinances> {
  const data = await apiRequest<{ finances: TimewebFinances }>(
    "/account/finances",
    token
  );
  return data.finances;
}

export function getServerMainIP(server: TimewebServer): string {
  for (const net of server.networks ?? []) {
    for (const ip of net.ips ?? []) {
      if (ip.is_main && ip.type === "ipv4") return ip.ip;
    }
  }
  return "—";
}

export function getStatusLabel(status: TimewebServer["status"]): string {
  const map: Record<string, string> = {
    on: "Работает",
    off: "Выключен",
    installing: "Установка",
    removing: "Удаление",
    rebooting: "Перезагрузка",
    starting: "Запуск",
    stopping: "Остановка",
    resetting_password: "Сброс пароля",
    reinstalling: "Переустановка",
    backup_creating: "Создание бэкапа",
    backup_restoring: "Восстановление",
    cloning: "Клонирование",
    migrating: "Миграция",
  };
  return map[status] ?? status;
}
