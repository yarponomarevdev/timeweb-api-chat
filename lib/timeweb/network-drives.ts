import { apiRequest } from "./client";
import type { TimewebNetworkDrive } from "@/types/timeweb";

export async function listNetworkDrives(token: string): Promise<TimewebNetworkDrive[]> {
  const data = await apiRequest<{ network_drives: TimewebNetworkDrive[] }>("/network-drives", token);
  return data.network_drives ?? [];
}

export async function getNetworkDrive(token: string, id: number): Promise<TimewebNetworkDrive> {
  const data = await apiRequest<{ network_drive: TimewebNetworkDrive }>(`/network-drives/${id}`, token);
  return data.network_drive;
}

export async function createNetworkDrive(
  token: string,
  params: { name: string; size: number; comment?: string; availability_zone?: string }
): Promise<TimewebNetworkDrive> {
  const data = await apiRequest<{ network_drive: TimewebNetworkDrive }>("/network-drives", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.network_drive;
}

export async function deleteNetworkDrive(token: string, id: number): Promise<null> {
  return apiRequest(`/network-drives/${id}`, token, { method: "DELETE" });
}

export async function mountNetworkDrive(
  token: string,
  id: number,
  serverId: number
): Promise<null> {
  return apiRequest(`/network-drives/${id}/bind`, token, {
    method: "POST",
    body: JSON.stringify({ resource_id: serverId, resource_type: "server" }),
  });
}

export async function unmountNetworkDrive(token: string, id: number): Promise<null> {
  return apiRequest(`/network-drives/${id}/unbind`, token, { method: "POST" });
}
