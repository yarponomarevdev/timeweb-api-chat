import { tool } from "ai";
import { z } from "zod";
import * as tw from "./timeweb";

export const tools = {
  list_servers: tool({
    description:
      "Получить список всех облачных серверов пользователя с их статусами, IP-адресами и характеристиками",
    inputSchema: z.object({}),
    execute: async () => {
      const servers = await tw.listServers();
      return servers.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        status_label: tw.getStatusLabel(s.status),
        ip: tw.getServerMainIP(s),
        os: s.os?.name ?? "—",
        os_version: s.os?.version ?? "",
        cpu: s.cpu,
        ram_mb: s.ram,
        disk_gb: Math.round(s.disk / 1024),
        comment: s.comment,
        created_at: s.created_at,
        location: s.location,
      }));
    },
  }),

  get_server: tool({
    description: "Получить подробную информацию о конкретном сервере по его ID",
    inputSchema: z.object({
      server_id: z.number().describe("ID сервера"),
    }),
    execute: async ({ server_id }) => {
      const s = await tw.getServer(server_id);
      return {
        id: s.id,
        name: s.name,
        status: s.status,
        status_label: tw.getStatusLabel(s.status),
        ip: tw.getServerMainIP(s),
        os: s.os?.name ?? "—",
        os_version: s.os?.version ?? "",
        cpu: s.cpu,
        ram_mb: s.ram,
        disk_gb: Math.round(s.disk / 1024),
        comment: s.comment,
        created_at: s.created_at,
        location: s.location,
        networks: s.networks,
      };
    },
  }),

  create_server: tool({
    description:
      "Создать новый облачный сервер. Перед созданием используй list_presets и list_os для получения актуальных ID тарифов и ОС",
    inputSchema: z.object({
      name: z.string().describe("Имя сервера (максимум 255 символов)"),
      os_id: z.number().describe("ID операционной системы из list_os"),
      preset_id: z
        .number()
        .describe("ID тарифа из list_presets"),
      bandwidth: z
        .number()
        .optional()
        .default(200)
        .describe("Пропускная способность в Мбит/с (100-1000, шаг 100)"),
      comment: z.string().optional().describe("Комментарий к серверу"),
    }),
    execute: async ({ name, os_id, preset_id, bandwidth, comment }) => {
      const server = await tw.createServer({
        name,
        os_id,
        preset_id,
        bandwidth: bandwidth ?? 200,
        comment,
      });
      return {
        id: server.id,
        name: server.name,
        status: server.status,
        status_label: tw.getStatusLabel(server.status),
        ip: tw.getServerMainIP(server),
        os: server.os?.name ?? "—",
        ram_mb: server.ram,
        created_at: server.created_at,
        message: "Сервер создаётся, обычно занимает 1-3 минуты",
      };
    },
  }),

  delete_server: tool({
    description:
      "Удалить сервер по его ID. ВАЖНО: Удаление необратимо! Обязательно подтверди у пользователя перед удалением.",
    inputSchema: z.object({
      server_id: z.number().describe("ID сервера для удаления"),
    }),
    execute: async ({ server_id }) => {
      await tw.deleteServer(server_id);
      return {
        success: true,
        message: `Сервер ${server_id} удалён`,
      };
    },
  }),

  server_action: tool({
    description:
      "Выполнить действие над сервером: start (запуск), shutdown (выключение), reboot (перезагрузка), reset_password (сброс пароля), reinstall (переустановка ОС)",
    inputSchema: z.object({
      server_id: z.number().describe("ID сервера"),
      action: z
        .enum(["start", "shutdown", "reboot", "reset_password", "reinstall"])
        .describe("Действие над сервером"),
    }),
    execute: async ({ server_id, action }) => {
      const result = await tw.serverAction(server_id, action);
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
          ? `Действие "${actionLabels[action]}" выполнено успешно`
          : `Не удалось выполнить действие "${actionLabels[action]}"`,
      };
    },
  }),

  list_presets: tool({
    description:
      "Получить список доступных тарифов для облачных серверов с характеристиками и ценами",
    inputSchema: z.object({
      ram_mb: z
        .number()
        .optional()
        .describe("Фильтр по оперативной памяти в МБ (например 2048 для 2GB)"),
    }),
    execute: async ({ ram_mb }) => {
      const presets = await tw.listPresets();
      const filtered = ram_mb
        ? presets.filter((p) => p.ram === ram_mb)
        : presets;
      return filtered.map((p) => ({
        id: p.id,
        cpu: p.cpu,
        ram_mb: p.ram,
        ram_gb: Math.round(p.ram / 1024),
        disk_gb: p.disk,
        bandwidth: p.bandwidth,
        price_per_month: p.price,
        description: p.description_short || p.description,
      }));
    },
  }),

  list_os: tool({
    description:
      "Получить список доступных операционных систем для установки на сервер",
    inputSchema: z.object({
      search: z
        .string()
        .optional()
        .describe("Поиск по названию ОС, например 'ubuntu' или 'debian'"),
    }),
    execute: async ({ search }) => {
      const osList = await tw.listOS();
      const filtered = search
        ? osList.filter(
            (os) =>
              os.name.toLowerCase().includes(search.toLowerCase()) ||
              os.version.toLowerCase().includes(search.toLowerCase())
          )
        : osList;
      return filtered.map((os) => ({
        id: os.id,
        name: os.name,
        version: os.version,
        family: os.family,
        full_name: `${os.name} ${os.version}`,
      }));
    },
  }),

  get_balance: tool({
    description: "Получить текущий баланс и финансовую информацию аккаунта",
    inputSchema: z.object({}),
    execute: async () => {
      const finances = await tw.getBalance();
      return {
        balance: finances.balance,
        currency: finances.currency ?? "RUB",
        total: finances.total,
        promocode_balance: finances.promocode_balance,
        hours_left: finances.hours_left,
        is_blocked: finances.is_blocked,
        penalty: finances.penalty,
      };
    },
  }),
};
