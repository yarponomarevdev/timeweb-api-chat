import type {
  TimewebServer,
  TimewebPreset,
  TimewebOS,
  TimewebFinances,
  TimewebCreateServerParams,
  ServerAction,
} from "@/types/timeweb";

const BASE = "https://api.timeweb.cloud/api/v1";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.TIMEWEB_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(
      `Timeweb API error ${res.status}: ${error.message || JSON.stringify(error)}`
    );
  }

  if (res.status === 204) return null as T;
  return res.json();
}

export async function listServers(): Promise<TimewebServer[]> {
  const data = await apiRequest<{ servers: TimewebServer[] }>("/servers");
  return data.servers;
}

export async function getServer(id: number): Promise<TimewebServer> {
  const data = await apiRequest<{ server: TimewebServer }>(`/servers/${id}`);
  return data.server;
}

export async function createServer(
  params: TimewebCreateServerParams
): Promise<TimewebServer> {
  const data = await apiRequest<{ server: TimewebServer }>("/servers", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.server;
}

export async function deleteServer(id: number): Promise<{ action_fields: Record<string, string> } | null> {
  return apiRequest(`/servers/${id}`, { method: "DELETE" });
}

export async function serverAction(
  id: number,
  action: ServerAction
): Promise<{ action: string; result: boolean }> {
  return apiRequest(`/servers/${id}/action`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export async function listPresets(): Promise<TimewebPreset[]> {
  const data = await apiRequest<{ servers_presets: TimewebPreset[] }>(
    "/presets/servers"
  );
  return data.servers_presets;
}

export async function listOS(): Promise<TimewebOS[]> {
  const data = await apiRequest<{ servers_os: TimewebOS[] }>("/os/servers");
  return data.servers_os;
}

export async function getBalance(): Promise<TimewebFinances> {
  const data = await apiRequest<{ finances: TimewebFinances }>(
    "/account/finances"
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
