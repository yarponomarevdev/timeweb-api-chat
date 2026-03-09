import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createDedicatedTools(token: string) {
  return {
    dedicated_servers: tool({
      description:
        "Управление выделенными серверами: list (список), get (детали), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete", "presets"]).describe("Действие"),
        server_id: z.number().optional().describe("ID выделенного сервера (для get, delete)"),
        name: z.string().optional().describe("Имя сервера (для create)"),
        plan_id: z.number().optional().describe("ID тарифного плана (для create)"),
        os_id: z.number().optional().describe("ID операционной системы (для create)"),
        comment: z.string().optional().describe("Комментарий (для create)"),
        availability_zone: z.string().optional().describe("Зона размещения (для create)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const servers = await tw.listDedicatedServers(token);
            return servers.map((s) => ({
              id: s.id,
              name: s.name,
              status: s.status,
              cpu: s.cpu?.description ?? "—",
              cpu_count: s.cpu?.count ?? 0,
              ram_gb: Math.round(((s.ram?.size ?? 0) * (s.ram?.count ?? 0)) / 1024),
              ip: s.ip,
              location: s.location,
              price: s.price,
              created_at: s.created_at,
            }));
          }
          case "get": {
            const s = await tw.getDedicatedServer(token, input.server_id!);
            return {
              id: s.id,
              name: s.name,
              comment: s.comment,
              status: s.status,
              os: s.os ? `${s.os.name} ${s.os.version}` : "—",
              cpu: s.cpu,
              ram: s.ram,
              disk: s.disk,
              ip: s.ip,
              ipmi_ip: s.ipmi_ip,
              location: s.location,
              availability_zone: s.availability_zone,
              network_bandwidth: s.network_bandwidth,
              price: s.price,
              created_at: s.created_at,
            };
          }
          case "create": {
            const s = await tw.createDedicatedServer(token, {
              name: input.name!,
              plan_id: input.plan_id!,
              os_id: input.os_id,
              comment: input.comment,
              availability_zone: input.availability_zone,
            });
            return {
              id: s.id,
              name: s.name,
              status: s.status,
              message: `Выделенный сервер "${s.name}" создаётся`,
            };
          }
          case "delete": {
            await tw.deleteDedicatedServer(token, input.server_id!);
            return {
              success: true,
              message: `Выделенный сервер ${input.server_id!} удалён`,
            };
          }
          case "presets": {
            const presets = await tw.listDedicatedPresets(token);
            return presets.map((p) => ({
              id: p.id,
              description: p.description,
              cpu: `${p.cpu.count}x ${p.cpu.description}`,
              ram_gb: Math.round((p.ram.size * p.ram.count) / 1024),
              disk: p.disk.map((d) => `${d.count}x ${d.size}GB ${d.type}`).join(", "),
              price_per_month: p.price,
              location: p.location,
            }));
          }
        }
      },
    }),
  };
}
