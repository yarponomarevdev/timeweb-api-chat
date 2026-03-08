import type {
  TimewebServer,
  TimewebPreset,
  TimewebOS,
  TimewebFinances,
  TimewebCreateServerParams,
  ServerAction,
  TimewebSSHKey,
  TimewebBackup,
  TimewebFirewallGroup,
  TimewebFirewallRule,
  TimewebServerStats,
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
  // API возвращает 204 No Content при успехе — считаем это успешным результатом
  const data = await apiRequest<{ action: string; result: boolean } | null>(
    `/servers/${id}/action`,
    token,
    { method: "POST", body: JSON.stringify({ action }) }
  );
  return data ?? { action, result: true };
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


// ─── SSH-ключи ───────────────────────────────────────────────────────────────

export async function listSSHKeys(token: string): Promise<TimewebSSHKey[]> {
  const data = await apiRequest<{ ssh_keys: TimewebSSHKey[] }>("/ssh-keys", token);
  return data.ssh_keys ?? [];
}

export async function createSSHKey(
  token: string,
  params: { name: string; body: string }
): Promise<TimewebSSHKey> {
  const data = await apiRequest<{ ssh_key: TimewebSSHKey }>("/ssh-keys", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.ssh_key;
}

export async function deleteSSHKey(token: string, id: number): Promise<null> {
  return apiRequest(`/ssh-keys/${id}`, token, { method: "DELETE" });
}

// ─── Изменение конфигурации (resize) ────────────────────────────────────────

export async function resizeServer(
  token: string,
  serverId: number,
  presetId: number
): Promise<TimewebServer> {
  const data = await apiRequest<{ server: TimewebServer }>(`/servers/${serverId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ preset_id: presetId }),
  });
  return data.server;
}

// ─── Бэкапы ─────────────────────────────────────────────────────────────────

export async function listBackups(token: string, serverId: number): Promise<TimewebBackup[]> {
  const data = await apiRequest<{ backups: TimewebBackup[] }>(
    `/servers/${serverId}/backups`,
    token
  );
  return data.backups ?? [];
}

export async function createBackup(
  token: string,
  serverId: number,
  comment?: string
): Promise<TimewebBackup> {
  const data = await apiRequest<{ backup: TimewebBackup }>(
    `/servers/${serverId}/backups`,
    token,
    { method: "POST", body: JSON.stringify({ comment: comment ?? "" }) }
  );
  return data.backup;
}

export async function restoreBackup(
  token: string,
  serverId: number,
  backupId: number
): Promise<{ result: boolean }> {
  return apiRequest(`/servers/${serverId}/backups/${backupId}/restore`, token, {
    method: "PUT",
  });
}

// ─── Статистика ──────────────────────────────────────────────────────────────

export async function getServerStats(
  token: string,
  serverId: number
): Promise<TimewebServerStats> {
  const to = new Date();
  const from = new Date(to.getTime() - 60 * 60 * 1000); // последний час
  const params = new URLSearchParams({
    date_from: from.toISOString(),
    date_to: to.toISOString(),
  });
  // Добавляем нужные ключи метрик
  for (const key of ["cpu_load", "network_traffic", "disk", "ram"]) {
    params.append("keys[]", key);
  }
  const data = await apiRequest<{ statistics?: TimewebServerStats | null } & Partial<TimewebServerStats>>(
    `/servers/${serverId}/statistics?${params}`,
    token
  );
  const source = data.statistics ?? data;
  return {
    cpu_load: Array.isArray(source.cpu_load) ? source.cpu_load : [],
    network_traffic: Array.isArray(source.network_traffic) ? source.network_traffic : [],
    disk: Array.isArray(source.disk) ? source.disk : [],
    ram: Array.isArray(source.ram) ? source.ram : [],
  };
}

// ─── Firewall ────────────────────────────────────────────────────────────────

export async function listFirewalls(token: string): Promise<TimewebFirewallGroup[]> {
  const data = await apiRequest<{ firewall_groups: TimewebFirewallGroup[] }>(
    "/firewall/groups",
    token
  );
  return data.firewall_groups ?? [];
}

export async function createFirewall(
  token: string,
  params: { name: string; description?: string }
): Promise<TimewebFirewallGroup> {
  const data = await apiRequest<{ firewall_group: TimewebFirewallGroup }>("/firewall/groups", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.firewall_group;
}

export async function deleteFirewall(token: string, id: string): Promise<null> {
  return apiRequest(`/firewall/groups/${id}`, token, { method: "DELETE" });
}

export async function listFirewallRules(
  token: string,
  firewallId: string
): Promise<TimewebFirewallRule[]> {
  const data = await apiRequest<{ firewall_rules: TimewebFirewallRule[] }>(
    `/firewall/groups/${firewallId}/rules`,
    token
  );
  return data.firewall_rules ?? [];
}

export async function addFirewallRule(
  token: string,
  firewallId: string,
  params: {
    direction: "ingress" | "egress";
    protocol: "tcp" | "udp" | "icmp" | "all";
    port?: string;
    cidr: string;
    description?: string;
  }
): Promise<TimewebFirewallRule> {
  const data = await apiRequest<{ firewall_rule: TimewebFirewallRule }>(
    `/firewall/groups/${firewallId}/rules`,
    token,
    { method: "POST", body: JSON.stringify(params) }
  );
  return data.firewall_rule;
}

export async function deleteFirewallRule(
  token: string,
  firewallId: string,
  ruleId: string
): Promise<null> {
  return apiRequest(`/firewall/groups/${firewallId}/rules/${ruleId}`, token, { method: "DELETE" });
}

export async function attachFirewallToServer(
  token: string,
  firewallId: string,
  serverId: number
): Promise<null> {
  return apiRequest(`/firewall/groups/${firewallId}/resources/servers`, token, {
    method: "POST",
    body: JSON.stringify({ resource_id: String(serverId) }),
  });
}

/**
 * Возвращает размер диска сервера в ГБ.
 * Сначала проверяет поле disk, затем суммирует массив disks[].size.
 * Если значение > 1000 — считаем МБ и делим на 1024, иначе уже ГБ.
 */
export function getServerDiskGB(server: TimewebServer): number {
  const raw = server.disk
    || server.disks?.reduce((sum, d) => sum + (d.size ?? 0), 0)
    || 0;
  if (!raw) return 0;
  return raw > 1000 ? Math.round(raw / 1024) : raw;
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
