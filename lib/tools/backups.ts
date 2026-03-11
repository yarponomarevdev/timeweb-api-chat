import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export interface DiskSummary {
  id: number;
  size_gb: number;
  used_gb: number;
  type: string;
  is_system: boolean;
  system_name: string;
  auto_backup: boolean;
  comment: string;
}

export interface BackupSummary {
  id: number;
  name: string;
  status: string;
  size_mb: number;
  created_at: string;
  comment: string;
  type: string;
  progress: number;
  disk_id: number;
}

export interface CreateBackupOutput extends BackupSummary {
  message: string;
}

export interface RestoreBackupOutput {
  success: boolean;
  message: string;
}

export interface DeleteBackupOutput {
  success: boolean;
  message: string;
}

function formatBackup(b: { id: number; name: string; status: string; size: number; created_at: string; comment: string; type: string; progress: number; disk_id: number }): BackupSummary {
  return {
    id: b.id,
    name: b.name,
    status: b.status,
    size_mb: Math.round(b.size / 1024 / 1024),
    created_at: b.created_at,
    comment: b.comment,
    type: b.type,
    progress: b.progress,
    disk_id: b.disk_id,
  };
}

/** Находит системный диск или единственный диск сервера */
async function resolveDisks(token: string, serverId: number) {
  const disks = await tw.listDisks(token, serverId);
  if (disks.length === 0) throw new Error("У сервера нет дисков");
  return disks;
}

function pickDisk(disks: Awaited<ReturnType<typeof tw.listDisks>>, diskId?: number) {
  if (diskId) {
    const disk = disks.find((d) => d.id === diskId);
    if (!disk) throw new Error(`Диск ${diskId} не найден у сервера`);
    return disk;
  }
  // Автовыбор: системный диск или единственный
  const systemDisk = disks.find((d) => d.is_system);
  if (systemDisk) return systemDisk;
  if (disks.length === 1) return disks[0];
  throw new Error(
    `У сервера несколько дисков. Укажи disk_id. Доступные: ${disks.map((d) => `${d.id} (${d.system_name}, ${Math.round(d.size / 1024)} ГБ)`).join(", ")}`
  );
}

const serverIdInputSchema = z
  .object({
    server_id: z.number().optional().describe("ID сервера"),
    id: z.number().optional().describe("Альтернативное поле ID сервера"),
  })
  .refine((v) => v.server_id != null || v.id != null, {
    message: "Нужно передать server_id или id",
  })
  .transform(({ server_id, id }) => ({ server_id: server_id ?? id! }));

export function createBackupTools(token: string) {
  return {
    list_server_disks: tool({
      description:
        "Показать диски сервера (для выбора при создании бэкапа). Вызывай перед create_backup если у сервера может быть несколько дисков.",
      inputSchema: serverIdInputSchema,
      execute: async ({ server_id }): Promise<DiskSummary[]> => {
        const disks = await tw.listDisks(token, server_id);
        return disks.map((d) => ({
          id: d.id,
          size_gb: Math.round(d.size / 1024),
          used_gb: Math.round(d.used / 1024),
          type: d.type,
          is_system: d.is_system,
          system_name: d.system_name,
          auto_backup: d.is_auto_backup,
          comment: d.comment,
        }));
      },
    }),

    list_backups: tool({
      description:
        "Показать список бэкапов сервера. Без disk_id покажет бэкапы всех дисков.",
      inputSchema: z
        .object({
          server_id: z.number().optional().describe("ID сервера"),
          id: z.number().optional().describe("Альтернативное поле ID сервера"),
          disk_id: z.number().optional().describe("ID диска (опционально, для фильтрации)"),
        })
        .refine((v) => v.server_id != null || v.id != null, {
          message: "Нужно передать server_id или id",
        })
        .transform(({ server_id, id, ...rest }) => ({
          ...rest,
          server_id: server_id ?? id!,
        })),
      execute: async ({ server_id, disk_id }): Promise<BackupSummary[]> => {
        const backups = await tw.listBackups(token, server_id, disk_id);
        return backups.map(formatBackup);
      },
    }),

    create_backup: tool({
      description:
        "Создать бэкап диска сервера. Если disk_id не указан — автоматически выберет системный диск. Для серверов с несколькими дисками вызови list_server_disks и укажи disk_id.",
      inputSchema: z
        .object({
          server_id: z.number().optional().describe("ID сервера"),
          id: z.number().optional().describe("Альтернативное поле ID сервера"),
          disk_id: z.number().optional().describe("ID диска (авто-определяется если не указан)"),
          comment: z.string().optional().describe("Комментарий к бэкапу"),
        })
        .refine((v) => v.server_id != null || v.id != null, {
          message: "Нужно передать server_id или id",
        })
        .transform(({ server_id, id, ...rest }) => ({
          ...rest,
          server_id: server_id ?? id!,
        })),
      execute: async ({ server_id, disk_id, comment }): Promise<CreateBackupOutput> => {
        const disks = await resolveDisks(token, server_id);
        const disk = pickDisk(disks, disk_id);
        const backup = await tw.createBackup(token, server_id, disk.id, comment);
        return {
          ...formatBackup(backup),
          message: `Создание бэкапа диска ${disk.system_name} запущено`,
        };
      },
    }),

    restore_backup: tool({
      description:
        "Восстановить диск сервера из бэкапа. ВАЖНО: данные диска будут перезаписаны! Требует подтверждения пользователя.",
      inputSchema: z
        .object({
          server_id: z.number().optional().describe("ID сервера"),
          id: z.number().optional().describe("Альтернативное поле ID сервера"),
          disk_id: z.number().optional().describe("ID диска (авто-определяется если не указан)"),
          backup_id: z.number().describe("ID бэкапа из list_backups"),
        })
        .refine((v) => v.server_id != null || v.id != null, {
          message: "Нужно передать server_id или id",
        })
        .transform(({ server_id, id, ...rest }) => ({
          ...rest,
          server_id: server_id ?? id!,
        })),
      execute: async ({ server_id, disk_id, backup_id }): Promise<RestoreBackupOutput> => {
        // Если disk_id не указан, пытаемся найти его из списка бэкапов
        let resolvedDiskId = disk_id;
        if (!resolvedDiskId) {
          const backups = await tw.listBackups(token, server_id);
          const target = backups.find((b) => b.id === backup_id);
          if (target) {
            resolvedDiskId = target.disk_id;
          } else {
            const disks = await resolveDisks(token, server_id);
            resolvedDiskId = pickDisk(disks).id;
          }
        }
        await tw.restoreBackup(token, server_id, resolvedDiskId, backup_id);
        return {
          success: true,
          message: "Восстановление из бэкапа запущено. Сервер будет недоступен несколько минут.",
        };
      },
    }),

    delete_backup: tool({
      description: "Удалить бэкап диска сервера.",
      inputSchema: z
        .object({
          server_id: z.number().optional().describe("ID сервера"),
          id: z.number().optional().describe("Альтернативное поле ID сервера"),
          disk_id: z.number().optional().describe("ID диска (авто-определяется если не указан)"),
          backup_id: z.number().describe("ID бэкапа"),
        })
        .refine((v) => v.server_id != null || v.id != null, {
          message: "Нужно передать server_id или id",
        })
        .transform(({ server_id, id, ...rest }) => ({
          ...rest,
          server_id: server_id ?? id!,
        })),
      execute: async ({ server_id, disk_id, backup_id }): Promise<DeleteBackupOutput> => {
        let resolvedDiskId = disk_id;
        if (!resolvedDiskId) {
          const backups = await tw.listBackups(token, server_id);
          const target = backups.find((b) => b.id === backup_id);
          if (target) {
            resolvedDiskId = target.disk_id;
          } else {
            const disks = await resolveDisks(token, server_id);
            resolvedDiskId = pickDisk(disks).id;
          }
        }
        await tw.deleteBackup(token, server_id, resolvedDiskId, backup_id);
        return {
          success: true,
          message: "Бэкап удалён",
        };
      },
    }),
  };
}
