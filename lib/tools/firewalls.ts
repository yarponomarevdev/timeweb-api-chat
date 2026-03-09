import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

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

export function createFirewallTools(token: string) {
  return {
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
