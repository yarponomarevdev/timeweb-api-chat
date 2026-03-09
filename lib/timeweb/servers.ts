import { apiRequest } from "./client";
import type {
  TimewebServer,
  TimewebPreset,
  TimewebOS,
  TimewebFinances,
  TimewebCreateServerParams,
  ServerAction,
  TimewebServerStats,
} from "@/types/timeweb";

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
  const data = await apiRequest<{ action: string; result: boolean } | null>(
    `/servers/${id}/action`,
    token,
    { method: "POST", body: JSON.stringify({ action }) }
  );
  return data ?? { action, result: true };
}

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

export async function getServerStats(
  token: string,
  serverId: number
): Promise<TimewebServerStats> {
  const to = new Date();
  const from = new Date(to.getTime() - 60 * 60 * 1000);
  const params = new URLSearchParams({
    date_from: from.toISOString(),
    date_to: to.toISOString(),
  });
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
