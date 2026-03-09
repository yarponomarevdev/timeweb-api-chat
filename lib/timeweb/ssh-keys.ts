import { apiRequest } from "./client";
import type { TimewebSSHKey } from "@/types/timeweb";

export async function listSSHKeys(token: string): Promise<TimewebSSHKey[]> {
  const data = await apiRequest<{ ssh_keys: TimewebSSHKey[] }>("/ssh-keys", token);
  return data.ssh_keys ?? [];
}

export async function createSSHKey(
  token: string,
  params: { name: string; body: string }
): Promise<TimewebSSHKey> {
  const data = await apiRequest<{ ssh_key: TimewebSSHKey }>("/ssh-keys", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.ssh_key;
}

export async function deleteSSHKey(token: string, id: number): Promise<null> {
  return apiRequest(`/ssh-keys/${id}`, token, { method: "DELETE" });
}
