import { tool } from "ai";
import { z } from "zod";
import * as tw from "./timeweb";
import type { TimewebServer } from "@/types/timeweb";

export interface ServerSummary {
  id: number;
  name: string;
  status: string;
  status_label: string;
  ip: string;
  os: string;
  os_version: string;
  cpu: number;
  ram_mb: number;
  disk_gb: number;
  comment: string;
  created_at: string;
  location: string;
}

export interface ServerSummaryWithNetworks extends ServerSummary {
  networks: TimewebServer["networks"];
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

export interface OsOption {
  id: number;
  name: string;
  version: string;
  full_name: string;
}

export interface PresetSummary {
  id: number;
  description: string;
  cpu: number;
  ram_mb: number;
  ram_gb: number;
  disk_gb: number;
  price_per_month: number;
  bandwidth: number;
}

export interface ProposeServerOutput {
  server_name: string;
  preset: PresetSummary;
  selected_os: OsOption;
  available_os: OsOption[];
}

export interface BalanceOutput {
  balance: number;
  currency: string;
  total: number;
  promocode_balance: number;
  hours_left: number | null;
  is_blocked: boolean;
  penalty: number;
}

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
      comment: z.string().optional().describe("Комментарий к серверу"),
    }),
    execute: async ({ name, os_id, preset_id, comment }) => {
      // Берём bandwidth из самого пресета, чтобы не получить 400 ошибку
      const presets = await tw.listPresets();
      const preset = presets.find((p) => p.id === preset_id);
      const bandwidth = preset?.bandwidth ?? 1000;

      const server = await tw.createServer({
        name,
        os_id,
        preset_id,
        bandwidth,
        comment,
      });

      // Проверяем статус — если no_paid, значит недостаточно средств
      if (server.status === "no_paid") {
        return {
          error: true,
          message: "Недостаточно средств на балансе для создания сервера. Пополните баланс в панели управления Timeweb Cloud.",
        };
      }

      return {
        id: server.id,
        name: server.name,
        status: server.status,
        status_label: tw.getStatusLabel(server.status),
        ip: tw.getServerMainIP(server),
        os: server.os?.name ?? "—",
        ram_mb: server.ram,
        created_at: server.created_at,
        message: "Сервер создаётся, обычно занимает 1–3 минуты",
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

  propose_server: tool({
    description:
      "Подготовить предложение конфигурации нового сервера. Используй ТОЛЬКО этот tool при создании сервера — он сам подберёт тариф и ОС без показа таблицы тарифов.",
    inputSchema: z.object({
      name: z.string().describe("Имя будущего сервера"),
      os_query: z
        .string()
        .describe("Название ОС, например 'ubuntu', 'debian', 'centos'"),
      ram_mb: z
        .number()
        .optional()
        .describe("Желаемый размер RAM в МБ (например 2048 для 2 GB)"),
    }),
    execute: async ({ name, os_query, ram_mb }) => {
      const [presets, osList] = await Promise.all([
        tw.listPresets(),
        tw.listOS(),
      ]);

      // Подбираем тариф — самый дешёвый с нужным RAM
      const targetRam = ram_mb ?? 2048;
      const matching = presets.filter((p) => p.ram === targetRam);
      const preset = (matching.length > 0 ? matching : presets)
        .sort((a, b) => a.price - b.price)[0];

      // Фильтруем ОС по запросу
      const matchingOs = osList.filter((os) =>
        os.name.toLowerCase().includes(os_query.toLowerCase())
      );
      // Берём последнюю стабильную версию (без alpha/beta/rc)
      const stableOs = matchingOs.filter(
        (os) => !/alpha|beta|rc/i.test(os.version)
      );
      const pool = stableOs.length > 0 ? stableOs : matchingOs;
      const defaultOs = pool.sort((a, b) =>
        b.version.localeCompare(a.version, undefined, { numeric: true })
      )[0];

      return {
        server_name: name,
        preset: {
          id: preset.id,
          description: preset.description_short || preset.description,
          cpu: preset.cpu,
          ram_mb: preset.ram,
          ram_gb: Math.round(preset.ram / 1024),
          disk_gb: preset.disk,
          price_per_month: preset.price,
          bandwidth: preset.bandwidth,
        },
        selected_os: {
          id: defaultOs.id,
          name: defaultOs.name,
          version: defaultOs.version,
          full_name: `${defaultOs.name} ${defaultOs.version}`,
        },
        available_os: matchingOs.map((os) => ({
          id: os.id,
          name: os.name,
          version: os.version,
          full_name: `${os.name} ${os.version}`,
        })),
      };
    },
  }),

  list_presets: tool({
    description:
      "Показать список доступных тарифов. Используй ТОЛЬКО когда пользователь явно просит показать тарифы — НЕ при создании сервера.",
    inputSchema: z.object({
      ram_mb: z
        .number()
        .optional()
        .describe("Фильтр по оперативной памяти в МБ"),
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
      "Показать список ОС. Используй ТОЛЬКО когда пользователь явно просит список ОС — НЕ при создании сервера (для этого есть propose_server).",
    inputSchema: z.object({
      search: z.string().optional().describe("Поиск по названию ОС"),
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
