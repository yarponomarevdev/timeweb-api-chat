import { apiRequest } from "./client";
import type { TimewebBackup } from "@/types/timeweb";

export async function listBackups(token: string, serverId: number): Promise<TimewebBackup[]> {
  const data = await apiRequest<{ backups: TimewebBackup[] }>(
    `/servers/${serverId}/backups`,
    token
  );
  return data.backups ?? [];
}

export async function createBackup(
  token: string,
  serverId: number,
  comment?: string
): Promise<TimewebBackup> {
  const data = await apiRequest<{ backup: TimewebBackup }>(
    `/servers/${serverId}/backups`,
    token,
    { method: "POST", body: JSON.stringify({ comment: comment ?? "" }) }
  );
  return data.backup;
}

export async function restoreBackup(
  token: string,
  serverId: number,
  backupId: number
): Promise<{ result: boolean }> {
  return apiRequest(`/servers/${serverId}/backups/${backupId}/restore`, token, {
    method: "PUT",
  });
}
