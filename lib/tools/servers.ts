import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export interface ServerSummary {
  id: number;
  name: string;
  status: string;
  status_label: string;
  os: string;
  os_version: string;
  software?: string;
  cpu: number;
  ram_mb: number;
  disk_gb: number;
  comment: string;
  created_at: string;
  location: string;
}

export interface ServerSummaryWithNetworks extends ServerSummary {
  networks: import("@/types/timeweb").TimewebServer["networks"];
}

export interface CreateServerSuccess extends ServerSummary {
  message: string;
}

export interface CreateServerError {
  error: true;
  message: string;
}

export type CreateServerOutput = CreateServerSuccess | CreateServerError;

export interface DeleteServerOutput {
  success: true;
  message: string;
}

export interface ServerActionOutput {
  success: boolean;
  action: string;
  action_label: string;
  server_id: number;
  message: string;
}

export interface ResizeServerOutput {
  id: number;
  name: string;
  cpu: number;
  ram_mb: number;
  ram_gb: number;
  disk_gb: number;
  status: string;
  status_label: string;
  message: string;
}

export interface ServerStatsOutput {
  server_id: number;
  period: string;
  cpu_avg: number | null;
  ram_avg: number | null;
  disk_avg: number | null;
  net_in_avg: number | null;
  net_out_avg: number | null;
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

export function createServerTools(token: string) {
  return {
    list_servers: tool({
      description:
        "Получить список всех облачных серверов пользователя с их статусами, IP-адресами и характеристиками",
      inputSchema: z.object({}),
      execute: async () => {
        const servers = await tw.listServers(token);
        return servers.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
          status_label: tw.getStatusLabel(s.status),
          os: s.os?.name ?? "—",
          os_version: s.os?.version ?? "",
          software: s.software?.name ?? undefined,
          cpu: s.cpu,
          ram_mb: s.ram,
          disk_gb: tw.getServerDiskGB(s),
          comment: s.comment,
          created_at: s.created_at,
          location: s.location,
        }));
      },
    }),

    get_server: tool({
      description: "Получить подробную информацию о конкретном сервере по его ID",
      inputSchema: serverIdInputSchema,
      execute: async ({ server_id }) => {
        const s = await tw.getServer(token, server_id);
        return {
          id: s.id,
          name: s.name,
          status: s.status,
          status_label: tw.getStatusLabel(s.status),
          os: s.os?.name ?? "—",
          os_version: s.os?.version ?? "",
          software: s.software?.name ?? undefined,
          cpu: s.cpu,
          ram_mb: s.ram,
          disk_gb: tw.getServerDiskGB(s),
          comment: s.comment,
          created_at: s.created_at,
          location: s.location,
          networks: s.networks,
        };
      },
    }),

    create_server: tool({
      description:
        "Создать новый облачный сервер. Для обычного сервера передай os_id, для сервера из маркетплейса передай software_id.",
      inputSchema: z
        .object({
          name: z.string().describe("Имя сервера (максимум 255 символов)"),
          os_id: z.number().optional().describe("ID операционной системы из list_os"),
          software_id: z.number().optional().describe("ID ПО из software(action: 'list')"),
          preset_id: z.number().describe("ID тарифа из list_presets"),
          comment: z.string().optional().describe("Комментарий к серверу"),
          availability_zone: z.string().optional().describe("Код локации для выбора пресета: ru-1 (СПб), ru-2 (Новосибирск), ru-3 (Москва), nl-1 (Амстердам), us-2 (Нью-Йорк), kz-1 (Алматы)"),
        })
        .refine((v) => v.os_id != null || v.software_id != null, {
          message: "Нужно передать os_id или software_id",
        }),
      execute: async ({ name, os_id, software_id, preset_id, comment, availability_zone }) => {
        const presets = await tw.listPresets(token);
        const originalPreset = presets.find((p) => p.id === preset_id);

        // Локация определяется пресетом — ищем пресет для нужной локации
        let finalPreset = originalPreset;
        if (originalPreset && availability_zone && originalPreset.location !== availability_zone) {
          const match = presets.find(
            (p) =>
              p.location === availability_zone &&
              p.cpu === originalPreset.cpu &&
              p.ram === originalPreset.ram &&
              p.disk === originalPreset.disk
          );
          if (match) finalPreset = match;
        }

        const bandwidth = finalPreset?.bandwidth ?? 1000;
        const finalPresetId = finalPreset?.id ?? preset_id;

        const server = await tw.createServer(token, {
          name,
          ...(os_id ? { os_id } : {}),
          ...(software_id ? { software_id } : {}),
          preset_id: finalPresetId,
          bandwidth,
          ...(comment ? { comment } : {}),
        });

        if (server.status === "no_paid") {
          return {
            error: true,
            message: "Недостаточно средств на балансе для создания сервера. Пополните баланс в панели управления evolvin.cloud.",
          };
        }

        return {
          id: server.id,
          name: server.name,
          status: server.status,
          status_label: tw.getStatusLabel(server.status),
          os: server.os?.name ?? "—",
          software: server.software?.name ?? undefined,
          cpu: server.cpu,
          ram_mb: server.ram,
          disk_gb: tw.getServerDiskGB(server),
          created_at: server.created_at,
          message: "Сервер создаётся, обычно занимает 1–3 минуты",
        };
      },
    }),

    delete_server: tool({
      description:
        "Удалить сервер по его ID. ВАЖНО: Удаление необратимо! Обязательно подтверди у пользователя перед удалением.",
      inputSchema: serverIdInputSchema,
      execute: async ({ server_id }) => {
        await tw.deleteServer(token, server_id);
        return {
          success: true,
          message: `Сервер ${server_id} удалён`,
        };
      },
    }),

    server_action: tool({
      description:
        "Выполнить действие над сервером: start (запуск), shutdown (выключение), reboot (перезагрузка), reset_password (сброс пароля), reinstall (переустановка ОС)",
      inputSchema: z
        .object({
          server_id: z.number().optional().describe("ID сервера"),
          id: z.number().optional().describe("Альтернативное поле ID сервера"),
          action: z
            .enum(["start", "shutdown", "reboot", "reset_password", "reinstall"])
            .describe("Действие над сервером"),
        })
        .refine((v) => v.server_id != null || v.id != null, {
          message: "Нужно передать server_id или id",
        })
        .transform(({ server_id, id, ...rest }) => ({
          ...rest,
          server_id: server_id ?? id!,
        })),
      execute: async ({ server_id, action }) => {
        const result = await tw.serverAction(token, server_id, action);
        const actionLabels: Record<string, string> = {
          start: "запуск",
          shutdown: "выключение",
          reboot: "перезагрузка",
          reset_password: "сброс пароля",
          reinstall: "переустановка",
        };
        return {
          success: result.result,
          action,
          action_label: actionLabels[action] ?? action,
          server_id,
          message: result.result
            ? `Действие «${actionLabels[action]}» выполнено успешно`
            : `Не удалось выполнить действие «${actionLabels[action]}»`,
        };
      },
    }),

    resize_server: tool({
      description:
        "Изменить конфигурацию сервера (тариф). Используй list_presets чтобы получить доступные preset_id.",
      inputSchema: z
        .object({
          server_id: z.number().optional().describe("ID сервера"),
          id: z.number().optional().describe("Альтернативное поле ID сервера"),
          preset_id: z.number().describe("Новый ID тарифа из list_presets"),
        })
        .refine((v) => v.server_id != null || v.id != null, {
          message: "Нужно передать server_id или id",
        })
        .transform(({ server_id, id, ...rest }) => ({
          ...rest,
          server_id: server_id ?? id!,
        })),
      execute: async ({ server_id, preset_id }) => {
        const server = await tw.resizeServer(token, server_id, preset_id);
        return {
          id: server.id,
          name: server.name,
          cpu: server.cpu,
          ram_mb: server.ram,
          ram_gb: Math.round(server.ram / 1024),
          disk_gb: Math.round(server.disk / 1024),
          status: server.status,
          status_label: tw.getStatusLabel(server.status),
          message: `Конфигурация сервера "${server.name}" изменена`,
        };
      },
    }),

    reboot_server_hard: tool({
      description: "Жёсткая перезагрузка сервера (hard reboot). Использовать когда обычная перезагрузка не помогает.",
      inputSchema: z.object({
        server_id: z.number().describe("ID сервера"),
      }),
      execute: async ({ server_id }) => {
        await tw.serverAction(token, server_id, "hard-reboot");
        return { success: true, message: `Жёсткая перезагрузка сервера ${server_id} выполнена` };
      },
    }),

    get_server_stats: tool({
      description: "Получить статистику загрузки сервера за последний час (CPU, RAM, сеть, диск)",
      inputSchema: serverIdInputSchema,
      execute: async ({ server_id }) => {
        const stats = await tw.getServerStats(token, server_id);

        const avg = (arr: Array<{ y: number }>) =>
          arr.length ? Math.round(arr.reduce((s, p) => s + p.y, 0) / arr.length * 10) / 10 : null;

        const netAvg = (arr: Array<{ y_in: number; y_out: number }>, key: "y_in" | "y_out") =>
          arr.length ? Math.round(arr.reduce((s, p) => s + p[key], 0) / arr.length) : null;

        return {
          server_id,
          period: "последний час",
          cpu_avg: avg(stats.cpu_load ?? []),
          ram_avg: avg(stats.ram ?? []),
          disk_avg: avg(stats.disk ?? []),
          net_in_avg: netAvg(stats.network_traffic ?? [], "y_in"),
          net_out_avg: netAvg(stats.network_traffic ?? [], "y_out"),
        };
      },
    }),
  };
}
