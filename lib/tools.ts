import { tool } from "ai";
import { z } from "zod";
import * as tw from "./timeweb";
import type { TimewebServer } from "@/types/timeweb";

export interface ServerSummary {
  id: number;
  name: string;
  status: string;
  status_label: string;
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
  available_presets: PresetSummary[];
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

export interface SSHKeySummary {
  id: number;
  name: string;
  fingerprint: string;
  created_at: string;
  used_at: string | null;
}

export interface CreateSSHKeyOutput extends SSHKeySummary {
  message: string;
}

export interface DeleteSSHKeyOutput {
  success: true;
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

export interface ServerStatsOutput {
  server_id: number;
  period: string;
  cpu_avg: number | null;
  ram_avg: number | null;
  disk_avg: number | null;
  net_in_avg: number | null;
  net_out_avg: number | null;
}

export interface FirewallGroupSummary {
  id: string;
  name: string;
  description: string;
  status: string;
  rules_count: number;
  resources_count: number;
  created_at: string;
}

export interface CreateFirewallOutput extends FirewallGroupSummary {
  message: string;
}

export interface FirewallRuleSummary {
  id: string;
  direction: string;
  protocol: string;
  port: string | null;
  cidr: string;
  description: string;
}

export interface AddFirewallRuleOutput extends FirewallRuleSummary {
  message: string;
}

export interface AttachFirewallOutput {
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

export function createTools(token: string) {
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
        const presets = await tw.listPresets(token);
        const preset = presets.find((p) => p.id === preset_id);
        const bandwidth = preset?.bandwidth ?? 1000;

        const server = await tw.createServer(token, {
          name,
          os_id,
          preset_id,
          bandwidth,
          comment,
        });

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
          os: server.os?.name ?? "—",
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
          tw.listPresets(token),
          tw.listOS(token),
        ]);

        const targetRam = ram_mb ?? 2048;
        const matching = presets.filter((p) => p.ram === targetRam);
        const preset = (matching.length > 0 ? matching : presets)
          .sort((a, b) => a.price - b.price)[0];

        // Ищем по полному имени "ubuntu 22.04" чтобы поддержать запросы вида "ubuntu 22"
        const query = os_query.toLowerCase();
        const matchingOs = osList.filter((os) => {
          const fullName = `${os.name} ${os.version}`.toLowerCase();
          return fullName.includes(query) || os.name.toLowerCase().includes(query);
        });
        const stableOs = matchingOs.filter(
          (os) => !/alpha|beta|rc/i.test(os.version)
        );
        const pool = stableOs.length > 0 ? stableOs : matchingOs;
        // Fallback на ubuntu если запрос не совпал ни с чем
        const sortedPool = (pool.length > 0 ? pool : osList).sort((a, b) =>
          b.version.localeCompare(a.version, undefined, { numeric: true })
        );
        const defaultOs = sortedPool[0];

        // Уникальные тарифы по RAM для выбора в форме (берём cheapest на каждый RAM)
        const presetsByRam = new Map<number, typeof preset>();
        for (const p of presets.sort((a, b) => a.price - b.price)) {
          if (!presetsByRam.has(p.ram)) presetsByRam.set(p.ram, p);
        }
        const availablePresets = Array.from(presetsByRam.values())
          .sort((a, b) => a.ram - b.ram)
          .slice(0, 6)
          .map((p) => ({
            id: p.id,
            description: p.description_short || p.description,
            cpu: p.cpu,
            ram_mb: p.ram,
            ram_gb: Math.round(p.ram / 1024),
            disk_gb: Math.round(p.disk / 1024),
            price_per_month: p.price,
            bandwidth: p.bandwidth,
          }));

        return {
          server_name: name,
          preset: {
            id: preset.id,
            description: preset.description_short || preset.description,
            cpu: preset.cpu,
            ram_mb: preset.ram,
            ram_gb: Math.round(preset.ram / 1024),
            disk_gb: Math.round(preset.disk / 1024),
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
          available_presets: availablePresets,
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
        const presets = await tw.listPresets(token);
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
        const osList = await tw.listOS(token);
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
        const finances = await tw.getBalance(token);
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

    // ─── SSH-ключи ──────────────────────────────────────────────────────────

    list_ssh_keys: tool({
      description: "Показать список SSH-ключей в аккаунте Timeweb",
      inputSchema: z.object({}),
      execute: async () => {
        const keys = await tw.listSSHKeys(token);
        return keys.map((k) => ({
          id: k.id,
          name: k.name,
          fingerprint: k.fingerprint,
          created_at: k.created_at,
          used_at: k.used_at,
        }));
      },
    }),

    create_ssh_key: tool({
      description: "Добавить SSH-ключ в аккаунт Timeweb",
      inputSchema: z.object({
        name: z.string().describe("Название ключа"),
        body: z.string().describe("Публичный ключ (содержимое файла .pub)"),
      }),
      execute: async ({ name, body }) => {
        const key = await tw.createSSHKey(token, { name, body });
        return {
          id: key.id,
          name: key.name,
          fingerprint: key.fingerprint,
          created_at: key.created_at,
          used_at: key.used_at,
          message: `SSH-ключ "${key.name}" успешно добавлен`,
        };
      },
    }),

    delete_ssh_key: tool({
      description: "Удалить SSH-ключ из аккаунта Timeweb по его ID",
      inputSchema: z
        .object({
          key_id: z.number().optional().describe("ID SSH-ключа"),
          id: z.number().optional().describe("Альтернативное поле ID SSH-ключа"),
          key_name: z.string().optional().describe("Имя ключа для подтверждения"),
        })
        .refine((v) => v.key_id != null || v.id != null, {
          message: "Нужно передать key_id или id",
        })
        .transform(({ key_id, id, ...rest }) => ({
          ...rest,
          key_id: key_id ?? id!,
        })),
      execute: async ({ key_id, key_name }) => {
        await tw.deleteSSHKey(token, key_id);
        return {
          success: true as const,
          message: `SSH-ключ ${key_name ? `"${key_name}"` : `#${key_id}`} удалён`,
        };
      },
    }),

    // ─── Resize сервера ──────────────────────────────────────────────────────

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

    // ─── Бэкапы ─────────────────────────────────────────────────────────────

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

    // ─── Мониторинг ──────────────────────────────────────────────────────────

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

    // ─── Firewall ────────────────────────────────────────────────────────────

    list_firewalls: tool({
      description: "Показать список групп безопасности (firewall) в аккаунте",
      inputSchema: z.object({}),
      execute: async () => {
        const groups = await tw.listFirewalls(token);
        return groups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          status: g.status,
          rules_count: g.rules_count,
          resources_count: g.resources_count,
          created_at: g.created_at,
        }));
      },
    }),

    create_firewall: tool({
      description: "Создать новую группу безопасности (firewall)",
      inputSchema: z.object({
        name: z.string().describe("Название группы"),
        description: z.string().optional().describe("Описание"),
      }),
      execute: async ({ name, description }) => {
        const group = await tw.createFirewall(token, { name, description });
        return {
          id: group.id,
          name: group.name,
          description: group.description,
          status: group.status,
          rules_count: group.rules_count,
          resources_count: group.resources_count,
          created_at: group.created_at,
          message: `Группа безопасности "${group.name}" создана`,
        };
      },
    }),

    delete_firewall: tool({
      description: "Удалить группу безопасности по ID",
      inputSchema: z
        .object({
          firewall_id: z.string().optional().describe("ID группы firewall"),
          id: z.string().optional().describe("Альтернативное поле ID группы firewall"),
        })
        .refine((v) => Boolean(v.firewall_id || v.id), {
          message: "Нужно передать firewall_id или id",
        })
        .transform(({ firewall_id, id }) => ({ firewall_id: firewall_id ?? id! })),
      execute: async ({ firewall_id }) => {
        await tw.deleteFirewall(token, firewall_id);
        return { success: true as const, message: `Группа ${firewall_id} удалена` };
      },
    }),

    add_firewall_rule: tool({
      description: "Добавить правило в группу безопасности",
      inputSchema: z.object({
        firewall_id: z.string().describe("ID группы firewall"),
        direction: z.enum(["ingress", "egress"]).describe("Направление: ingress (входящий) или egress (исходящий)"),
        protocol: z.enum(["tcp", "udp", "icmp", "all"]).describe("Протокол"),
        port: z.string().optional().describe("Порт или диапазон, например '22' или '8000-9000'"),
        cidr: z.string().describe("CIDR-блок, например '0.0.0.0/0' или '192.168.1.0/24'"),
        description: z.string().optional().describe("Описание правила"),
      }),
      execute: async ({ firewall_id, direction, protocol, port, cidr, description }) => {
        const rule = await tw.addFirewallRule(token, firewall_id, {
          direction, protocol, port, cidr, description,
        });
        return {
          id: rule.id,
          direction: rule.direction,
          protocol: rule.protocol,
          port: rule.port,
          cidr: rule.cidr,
          description: rule.description,
          message: "Правило добавлено",
        };
      },
    }),

    delete_firewall_rule: tool({
      description: "Удалить правило из группы безопасности",
      inputSchema: z
        .object({
          firewall_id: z.string().optional().describe("ID группы firewall"),
          group_id: z.string().optional().describe("Альтернативное поле ID группы firewall"),
          rule_id: z.string().optional().describe("ID правила"),
          id: z.string().optional().describe("Альтернативное поле ID правила"),
        })
        .refine((v) => Boolean(v.firewall_id || v.group_id), {
          message: "Нужно передать firewall_id или group_id",
        })
        .refine((v) => Boolean(v.rule_id || v.id), {
          message: "Нужно передать rule_id или id",
        })
        .transform(({ firewall_id, group_id, rule_id, id }) => ({
          firewall_id: firewall_id ?? group_id!,
          rule_id: rule_id ?? id!,
        })),
      execute: async ({ firewall_id, rule_id }) => {
        await tw.deleteFirewallRule(token, firewall_id, rule_id);
        return { success: true as const, message: `Правило ${rule_id} удалено` };
      },
    }),

    attach_firewall_to_server: tool({
      description: "Привязать группу безопасности к серверу",
      inputSchema: z
        .object({
          firewall_id: z.string().optional().describe("ID группы firewall"),
          group_id: z.string().optional().describe("Альтернативное поле ID группы firewall"),
          server_id: z.number().optional().describe("ID сервера"),
          id: z.number().optional().describe("Альтернативное поле ID сервера"),
        })
        .refine((v) => Boolean(v.firewall_id || v.group_id), {
          message: "Нужно передать firewall_id или group_id",
        })
        .refine((v) => v.server_id != null || v.id != null, {
          message: "Нужно передать server_id или id",
        })
        .transform(({ firewall_id, group_id, server_id, id }) => ({
          firewall_id: firewall_id ?? group_id!,
          server_id: server_id ?? id!,
        })),
      execute: async ({ firewall_id, server_id }) => {
        await tw.attachFirewallToServer(token, firewall_id, server_id);
        return {
          success: true,
          message: `Группа безопасности привязана к серверу ${server_id}`,
        };
      },
    }),
  };
}
