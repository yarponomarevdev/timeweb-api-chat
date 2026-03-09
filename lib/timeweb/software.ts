import { apiRequest } from "./client";
import type { TimewebSoftware } from "@/types/timeweb";

export async function listSoftware(token: string): Promise<TimewebSoftware[]> {
  const data = await apiRequest<{ software: TimewebSoftware[] }>("/software", token);
  return data.software ?? [];
}

export async function getSoftware(token: string, id: number): Promise<TimewebSoftware> {
  const data = await apiRequest<{ software: TimewebSoftware }>(`/software/${id}`, token);
  return data.software;
}
