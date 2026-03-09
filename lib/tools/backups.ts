import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export interface BackupSummary {
  id: number;
  name: string;
  status: string;
  size_mb: number;
  created_at: string;
  comment: string;
}

export interface CreateBackupOutput extends BackupSummary {
  message: string;
}

export interface RestoreBackupOutput {
  success: boolean;
  message: string;
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
    list_backups: tool({
      description: "Показать список бэкапов сервера",
      inputSchema: serverIdInputSchema,
      execute: async ({ server_id }) => {
        const backups = await tw.listBackups(token, server_id);
        return backups.map((b) => ({
          id: b.id,
          name: b.name,
          status: b.status,
          size_mb: Math.round(b.size / 1024 / 1024),
          created_at: b.created_at,
          comment: b.comment,
        }));
      },
    }),

    create_backup: tool({
      description: "Создать бэкап сервера",
      inputSchema: z
        .object({
          server_id: z.number().optional().describe("ID сервера"),
          id: z.number().optional().describe("Альтернативное поле ID сервера"),
          comment: z.string().optional().describe("Комментарий к бэкапу"),
        })
        .refine((v) => v.server_id != null || v.id != null, {
          message: "Нужно передать server_id или id",
        })
        .transform(({ server_id, id, ...rest }) => ({
          ...rest,
          server_id: server_id ?? id!,
        })),
      execute: async ({ server_id, comment }) => {
        const backup = await tw.createBackup(token, server_id, comment);
        return {
          id: backup.id,
          name: backup.name,
          status: backup.status,
          size_mb: Math.round(backup.size / 1024 / 1024),
          created_at: backup.created_at,
          comment: backup.comment,
          message: "Создание бэкапа запущено",
        };
      },
    }),

    restore_backup: tool({
      description:
        "Восстановить сервер из бэкапа. ВАЖНО: данные сервера будут перезаписаны! Требует подтверждения.",
      inputSchema: z
        .object({
          server_id: z.number().optional().describe("ID сервера"),
          id: z.number().optional().describe("Альтернативное поле ID сервера"),
          backup_id: z.number().describe("ID бэкапа из list_backups"),
        })
        .refine((v) => v.server_id != null || v.id != null, {
          message: "Нужно передать server_id или id",
        })
        .transform(({ server_id, id, ...rest }) => ({
          ...rest,
          server_id: server_id ?? id!,
        })),
      execute: async ({ server_id, backup_id }) => {
        const result = await tw.restoreBackup(token, server_id, backup_id);
        return {
          success: result?.result ?? true,
          message: "Восстановление из бэкапа запущено. Сервер будет недоступен несколько минут.",
        };
      },
    }),
  };
}
