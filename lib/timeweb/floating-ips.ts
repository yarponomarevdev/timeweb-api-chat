import { apiRequest } from "./client";
import type { TimewebFloatingIP } from "@/types/timeweb";

export async function listFloatingIPs(token: string): Promise<TimewebFloatingIP[]> {
  const data = await apiRequest<{ floating_ips: TimewebFloatingIP[] }>("/floating-ips", token);
  return data.floating_ips ?? [];
}

export async function getFloatingIP(token: string, id: string): Promise<TimewebFloatingIP> {
  const data = await apiRequest<{ floating_ip: TimewebFloatingIP }>(`/floating-ips/${id}`, token);
  return data.floating_ip;
}

export async function createFloatingIP(
  token: string,
  params: { availability_zone?: string; is_ddos_guard?: boolean; comment?: string }
): Promise<TimewebFloatingIP> {
  const data = await apiRequest<{ floating_ip: TimewebFloatingIP }>("/floating-ips", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.floating_ip;
}

export async function deleteFloatingIP(token: string, id: string): Promise<null> {
  return apiRequest(`/floating-ips/${id}`, token, { method: "DELETE" });
}

export async function bindFloatingIP(
  token: string,
  id: string,
  resourceId: number,
  resourceType: string
): Promise<null> {
  return apiRequest(`/floating-ips/${id}/bind`, token, {
    method: "POST",
    body: JSON.stringify({ resource_id: resourceId, resource_type: resourceType }),
  });
}

export async function unbindFloatingIP(token: string, id: string): Promise<null> {
  return apiRequest(`/floating-ips/${id}/unbind`, token, { method: "POST" });
}
