import { apiRequest } from "./client";
import type { TimewebBackup } from "@/types/timeweb/backups";
import type { TimewebDisk } from "@/types/timeweb/servers";

export async function listDisks(token: string, serverId: number): Promise<TimewebDisk[]> {
  const data = await apiRequest<{ server_disks: TimewebDisk[] }>(
    `/servers/${serverId}/disks`,
    token
  );
  return data.server_disks ?? [];
}

export async function listBackups(
  token: string,
  serverId: number,
  diskId?: number
): Promise<TimewebBackup[]> {
  const path = diskId
    ? `/servers/${serverId}/disks/${diskId}/backups`
    : `/servers/${serverId}/backups`;
  const data = await apiRequest<{ backups: TimewebBackup[] }>(path, token);
  return data.backups ?? [];
}

export async function createBackup(
  token: string,
  serverId: number,
  diskId: number,
  comment?: string
): Promise<TimewebBackup> {
  const data = await apiRequest<{ backup: TimewebBackup }>(
    `/servers/${serverId}/disks/${diskId}/backups`,
    token,
    { method: "POST", body: JSON.stringify({ comment: comment ?? "" }) }
  );
  return data.backup;
}

export async function restoreBackup(
  token: string,
  serverId: number,
  diskId: number,
  backupId: number
): Promise<void> {
  await apiRequest(
    `/servers/${serverId}/disks/${diskId}/backups/${backupId}/action`,
    token,
    { method: "POST", body: JSON.stringify({ action: "restore" }) }
  );
}

export async function deleteBackup(
  token: string,
  serverId: number,
  diskId: number,
  backupId: number
): Promise<void> {
  await apiRequest(
    `/servers/${serverId}/disks/${diskId}/backups/${backupId}`,
    token,
    { method: "DELETE" }
  );
}
