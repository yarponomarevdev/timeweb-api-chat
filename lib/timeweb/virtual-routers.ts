import { apiRequest } from "./client";
import type { TimewebVirtualRouter } from "@/types/timeweb";

export async function listVirtualRouters(token: string): Promise<TimewebVirtualRouter[]> {
  const data = await apiRequest<{ virtual_routers: TimewebVirtualRouter[] }>("/virtual-routers", token);
  return data.virtual_routers ?? [];
}

export async function getVirtualRouter(token: string, id: number): Promise<TimewebVirtualRouter> {
  const data = await apiRequest<{ virtual_router: TimewebVirtualRouter }>(`/virtual-routers/${id}`, token);
  return data.virtual_router;
}

export async function createVirtualRouter(
  token: string,
  params: {
    name: string;
    location?: string;
    availability_zone?: string;
    description?: string;
  }
): Promise<TimewebVirtualRouter> {
  const data = await apiRequest<{ virtual_router: TimewebVirtualRouter }>("/virtual-routers", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.virtual_router;
}

export async function deleteVirtualRouter(token: string, id: number): Promise<null> {
  return apiRequest(`/virtual-routers/${id}`, token, { method: "DELETE" });
}
