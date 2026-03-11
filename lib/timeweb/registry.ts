import { apiRequest } from "./client";
import type { TimewebRegistry } from "@/types/timeweb";

export async function listRegistries(token: string): Promise<TimewebRegistry[]> {
  const data = await apiRequest<{ container_registry_list: TimewebRegistry[] }>("/container-registry", token);
  return data.container_registry_list ?? [];
}

export async function getRegistry(token: string, id: number): Promise<TimewebRegistry> {
  const data = await apiRequest<{ container_registry: TimewebRegistry }>(`/container-registry/${id}`, token);
  return data.container_registry;
}

export async function createRegistry(
  token: string,
  params: { name: string; location?: string }
): Promise<TimewebRegistry> {
  const data = await apiRequest<{ container_registry: TimewebRegistry }>("/container-registry", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.container_registry;
}

export async function deleteRegistry(token: string, id: number): Promise<null> {
  return apiRequest(`/container-registry/${id}`, token, { method: "DELETE" });
}
