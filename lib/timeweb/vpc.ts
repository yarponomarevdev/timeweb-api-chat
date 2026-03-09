import { apiRequest } from "./client";
import type { TimewebVPC, TimewebVPCService } from "@/types/timeweb";

export async function listVPCs(token: string): Promise<TimewebVPC[]> {
  const data = await apiRequest<{ vpcs: TimewebVPC[] }>("/vpcs", token);
  return data.vpcs ?? [];
}

export async function getVPC(token: string, id: string): Promise<TimewebVPC> {
  const data = await apiRequest<{ vpc: TimewebVPC }>(`/vpcs/${id}`, token);
  return data.vpc;
}

export async function createVPC(
  token: string,
  params: { name: string; subnet_v4: string; location?: string; availability_zone?: string; description?: string }
): Promise<TimewebVPC> {
  const data = await apiRequest<{ vpc: TimewebVPC }>("/vpcs", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.vpc;
}

export async function deleteVPC(token: string, id: string): Promise<null> {
  return apiRequest(`/vpcs/${id}`, token, { method: "DELETE" });
}

export async function listVPCServices(token: string, vpcId: string): Promise<TimewebVPCService[]> {
  const data = await apiRequest<{ services: TimewebVPCService[] }>(`/vpcs/${vpcId}/services`, token);
  return data.services ?? [];
}
