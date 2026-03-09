import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createFloatingIPTools(token: string) {
  return {
    floating_ips: tool({
      description:
        "Управление плавающими IP-адресами: list (список), get (детали), create (создать), delete (удалить), bind (привязать к ресурсу), unbind (отвязать)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete", "bind", "unbind"]).describe("Действие"),
        ip_id: z.string().optional().describe("ID плавающего IP (для get, delete, bind, unbind)"),
        availability_zone: z.string().optional().describe("Зона размещения (для create)"),
        is_ddos_guard: z.boolean().optional().describe("Защита от DDoS (для create)"),
        comment: z.string().optional().describe("Комментарий (для create)"),
        resource_id: z.number().optional().describe("ID ресурса для привязки (для bind)"),
        resource_type: z.string().optional().describe("Тип ресурса, server/balancer и др. (для bind)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const ips = await tw.listFloatingIPs(token);
            return ips.map((ip) => ({
              id: ip.id,
              ip: ip.ip,
              is_ddos_guard: ip.is_ddos_guard,
              availability_zone: ip.availability_zone,
              comment: ip.comment,
              resource_id: ip.resource_id,
              resource_type: ip.resource_type,
              created_at: ip.created_at,
            }));
          }
          case "get": {
            const ip = await tw.getFloatingIP(token, input.ip_id!);
            return {
              id: ip.id,
              ip: ip.ip,
              is_ddos_guard: ip.is_ddos_guard,
              availability_zone: ip.availability_zone,
              comment: ip.comment,
              ptr: ip.ptr,
              resource_id: ip.resource_id,
              resource_type: ip.resource_type,
              created_at: ip.created_at,
            };
          }
          case "create": {
            const ip = await tw.createFloatingIP(token, {
              availability_zone: input.availability_zone,
              is_ddos_guard: input.is_ddos_guard,
              comment: input.comment,
            });
            return {
              id: ip.id,
              ip: ip.ip,
              is_ddos_guard: ip.is_ddos_guard,
              message: `Плавающий IP ${ip.ip} создан`,
            };
          }
          case "delete": {
            await tw.deleteFloatingIP(token, input.ip_id!);
            return {
              success: true,
              message: `Плавающий IP ${input.ip_id} удалён`,
            };
          }
          case "bind": {
            await tw.bindFloatingIP(token, input.ip_id!, input.resource_id!, input.resource_type!);
            return {
              success: true,
              message: `Плавающий IP ${input.ip_id} привязан к ${input.resource_type} #${input.resource_id}`,
            };
          }
          case "unbind": {
            await tw.unbindFloatingIP(token, input.ip_id!);
            return {
              success: true,
              message: `Плавающий IP ${input.ip_id} отвязан`,
            };
          }
        }
      },
    }),
  };
}
