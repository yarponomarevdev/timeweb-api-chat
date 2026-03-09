import { apiRequest } from "./client";
import type { TimewebDomain } from "@/types/timeweb";

export async function listDomains(token: string): Promise<TimewebDomain[]> {
  const data = await apiRequest<{ domains: TimewebDomain[] }>("/domains", token);
  return data.domains;
}
