import { apiRequest } from "./client";
import type { TimewebDedicatedServer, TimewebDedicatedPreset } from "@/types/timeweb";

export async function listDedicatedServers(token: string): Promise<TimewebDedicatedServer[]> {
  const data = await apiRequest<{ dedicated_servers: TimewebDedicatedServer[] }>("/dedicated-servers", token);
  return data.dedicated_servers ?? [];
}

export async function getDedicatedServer(token: string, id: number): Promise<TimewebDedicatedServer> {
  const data = await apiRequest<{ dedicated_server: TimewebDedicatedServer }>(`/dedicated-servers/${id}`, token);
  return data.dedicated_server;
}

export async function createDedicatedServer(
  token: string,
  params: {
    name: string;
    plan_id: number;
    os_id?: number;
    comment?: string;
    availability_zone?: string;
  }
): Promise<TimewebDedicatedServer> {
  const data = await apiRequest<{ dedicated_server: TimewebDedicatedServer }>("/dedicated-servers", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.dedicated_server;
}

export async function deleteDedicatedServer(token: string, id: number): Promise<null> {
  return apiRequest(`/dedicated-servers/${id}`, token, { method: "DELETE" });
}

export async function listDedicatedPresets(token: string): Promise<TimewebDedicatedPreset[]> {
  const data = await apiRequest<{ dedicated_servers_presets: TimewebDedicatedPreset[] }>("/presets/dedicated-servers", token);
  return data.dedicated_servers_presets ?? [];
}
