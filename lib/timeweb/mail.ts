import { apiRequest } from "./client";
import type { TimewebMailDomain, TimewebMailbox } from "@/types/timeweb";

export async function listMailDomains(token: string): Promise<TimewebMailDomain[]> {
  const data = await apiRequest<{ mailboxes: TimewebMailDomain[] }>("/mail", token);
  return data.mailboxes ?? [];
}

export async function createMailDomain(
  token: string,
  params: { fqdn: string }
): Promise<TimewebMailDomain> {
  const data = await apiRequest<{ mailbox: TimewebMailDomain }>("/mail", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.mailbox;
}

export async function deleteMailDomain(token: string, id: number): Promise<null> {
  return apiRequest(`/mail/${id}`, token, { method: "DELETE" });
}

export async function listMailboxes(token: string, domainId: number): Promise<TimewebMailbox[]> {
  const data = await apiRequest<{ mailboxes: TimewebMailbox[] }>(
    `/mail/${domainId}/mailboxes`,
    token
  );
  return data.mailboxes ?? [];
}

export async function createMailbox(
  token: string,
  domainId: number,
  params: { email: string; password: string; comment?: string }
): Promise<TimewebMailbox> {
  const data = await apiRequest<{ mailbox: TimewebMailbox }>(
    `/mail/${domainId}/mailboxes`,
    token,
    { method: "POST", body: JSON.stringify(params) }
  );
  return data.mailbox;
}

export async function deleteMailbox(
  token: string,
  domainId: number,
  mailboxId: number
): Promise<null> {
  return apiRequest(`/mail/${domainId}/mailboxes/${mailboxId}`, token, { method: "DELETE" });
}
