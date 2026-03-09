import { apiRequest } from "./client";
import type { TimewebDomain } from "@/types/timeweb";

export async function listDomains(token: string): Promise<TimewebDomain[]> {
  const data = await apiRequest<{ domains: TimewebDomain[] }>("/domains", token);
  return data.domains ?? [];
}

export async function getDomain(token: string, id: number): Promise<TimewebDomain> {
  const data = await apiRequest<{ domain: TimewebDomain }>(`/domains/${id}`, token);
  return data.domain;
}

export async function createDomain(
  token: string,
  params: { fqdn: string; is_autoprolong?: boolean }
): Promise<TimewebDomain> {
  const data = await apiRequest<{ domain: TimewebDomain }>("/domains", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.domain;
}

export async function deleteDomain(token: string, id: number): Promise<null> {
  return apiRequest(`/domains/${id}`, token, { method: "DELETE" });
}
