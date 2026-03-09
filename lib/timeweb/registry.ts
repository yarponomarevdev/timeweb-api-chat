import { apiRequest } from "./client";
import type { TimewebRegistry } from "@/types/timeweb";

export async function listRegistries(token: string): Promise<TimewebRegistry[]> {
  const data = await apiRequest<{ docker_registries: TimewebRegistry[] }>("/dbs/docker-registries", token);
  return data.docker_registries ?? [];
}

export async function getRegistry(token: string, id: number): Promise<TimewebRegistry> {
  const data = await apiRequest<{ docker_registry: TimewebRegistry }>(`/dbs/docker-registries/${id}`, token);
  return data.docker_registry;
}

export async function createRegistry(
  token: string,
  params: { name: string; location?: string }
): Promise<TimewebRegistry> {
  const data = await apiRequest<{ docker_registry: TimewebRegistry }>("/dbs/docker-registries", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.docker_registry;
}

export async function deleteRegistry(token: string, id: number): Promise<null> {
  return apiRequest(`/dbs/docker-registries/${id}`, token, { method: "DELETE" });
}
