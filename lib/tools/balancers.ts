import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";
import type { TimewebBalancerRule } from "@/types/timeweb/balancers";

export function createBalancerTools(token: string) {
  return {
    load_balancers: tool({
      description:
        "Управление балансировщиками нагрузки: list (список), get (детали), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete", "presets"]).describe("Действие"),
        balancer_id: z.number().optional().describe("ID балансировщика (для get, delete)"),
        name: z.string().optional().describe("Имя балансировщика (для create)"),
        preset_id: z.number().optional().describe("ID тарифа (для create)"),
        proto: z.string().optional().describe("Протокол проверки, http или tcp (для create)"),
        port: z.number().optional().describe("Порт проверки (для create)"),
        algo: z.string().optional().describe("Алгоритм балансировки, roundrobin или leastconn (для create)"),
        is_sticky: z.boolean().optional().describe("Привязка сессий (для create)"),
        is_ssl: z.boolean().optional().describe("SSL (для create)"),
        is_keepalive: z.boolean().optional().describe("Keep-alive (для create)"),
        path: z.string().optional().describe("Путь для проверки (для create)"),
        availability_zone: z.string().optional().describe("Зона размещения (для create)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const balancers = await tw.listBalancers(token);
            return balancers.map((b) => ({
              id: b.id,
              name: b.name,
              status: b.status,
              algo: b.algo,
              ip: b.ip,
              port: b.port,
              proto: b.proto,
              is_ssl: b.is_ssl,
              location: b.location,
              rules_count: b.rules?.length ?? 0,
              created_at: b.created_at,
            }));
          }
          case "get": {
            const b = await tw.getBalancer(token, input.balancer_id!);
            return {
              id: b.id,
              name: b.name,
              status: b.status,
              algo: b.algo,
              ip: b.ip,
              port: b.port,
              proto: b.proto,
              path: b.path,
              is_ssl: b.is_ssl,
              is_sticky: b.is_sticky,
              is_use_proxy: b.is_use_proxy,
              is_keepalive: b.is_keepalive,
              location: b.location,
              availability_zone: b.availability_zone,
              created_at: b.created_at,
              rules: b.rules?.map((r: TimewebBalancerRule) => ({
                id: r.id,
                balancer_proto: r.balancer_proto,
                balancer_port: r.balancer_port,
                server_proto: r.server_proto,
                server_port: r.server_port,
              })) ?? [],
            };
          }
          case "create": {
            const b = await tw.createBalancer(token, {
              name: input.name!,
              preset_id: input.preset_id!,
              proto: input.proto!,
              port: input.port!,
              algo: input.algo,
              is_sticky: input.is_sticky,
              is_ssl: input.is_ssl,
              is_keepalive: input.is_keepalive,
              path: input.path,
              availability_zone: input.availability_zone,
            });
            return {
              id: b.id,
              name: b.name,
              status: b.status,
              ip: b.ip,
              message: "Балансировщик нагрузки создаётся",
            };
          }
          case "delete": {
            await tw.deleteBalancer(token, input.balancer_id!);
            return {
              success: true,
              message: `Балансировщик ${input.balancer_id} удалён`,
            };
          }
          case "presets": {
            const presets = await tw.listBalancerPresets(token);
            return presets.map((p) => ({
              id: p.id,
              description: p.description,
              bandwidth: p.bandwidth,
              replica_count: p.replica_count,
              request_per_second: p.request_per_second,
              price_per_month: p.price,
              location: p.location,
            }));
          }
        }
      },
    }),

    load_balancer_rules: tool({
      description:
        "Управление правилами балансировщика: list (список правил), add (добавить правило), delete (удалить правило)",
      inputSchema: z.object({
        action: z.enum(["list", "add", "delete"]).describe("Действие"),
        balancer_id: z.number().optional().describe("ID балансировщика (для list, add, delete)"),
        balancer_proto: z.string().optional().describe("Протокол балансировщика, http/tcp/https (для add)"),
        balancer_port: z.number().optional().describe("Порт балансировщика (для add)"),
        server_proto: z.string().optional().describe("Протокол сервера, http/tcp (для add)"),
        server_port: z.number().optional().describe("Порт сервера (для add)"),
        rule_id: z.number().optional().describe("ID правила (для delete)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const rules = await tw.listBalancerRules(token, input.balancer_id!);
            return rules.map((r) => ({
              id: r.id,
              balancer_proto: r.balancer_proto,
              balancer_port: r.balancer_port,
              server_proto: r.server_proto,
              server_port: r.server_port,
            }));
          }
          case "add": {
            const r = await tw.addBalancerRule(token, input.balancer_id!, {
              balancer_proto: input.balancer_proto!,
              balancer_port: input.balancer_port!,
              server_proto: input.server_proto!,
              server_port: input.server_port!,
            });
            return {
              id: r.id,
              balancer_proto: r.balancer_proto,
              balancer_port: r.balancer_port,
              server_proto: r.server_proto,
              server_port: r.server_port,
              message: "Правило добавлено",
            };
          }
          case "delete": {
            await tw.deleteBalancerRule(token, input.balancer_id!, input.rule_id!);
            return {
              success: true,
              message: `Правило ${input.rule_id} удалено`,
            };
          }
        }
      },
    }),
  };
}
