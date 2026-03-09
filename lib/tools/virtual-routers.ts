import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createVirtualRouterTools(token: string) {
  return {
    virtual_routers: tool({
      description:
        "Управление виртуальными роутерами: list (список), get (детали), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete"]).describe("Действие"),
        router_id: z.number().optional().describe("ID роутера (для get/delete)"),
        router_name: z.string().optional().describe("Имя роутера (для get/delete)"),
        name: z.string().optional().describe("Имя роутера (для create)"),
        location: z.string().optional().describe("Локация (для create)"),
        availability_zone: z.string().optional().describe("Зона размещения (для create)"),
        description: z.string().optional().describe("Описание (для create)"),
      }),
      execute: async (input) => {
        const resolveRouterId = async () => {
          if (input.router_id) return input.router_id;
          if (!input.router_name) throw new Error("Нужен router_id или router_name");
          const routers = await tw.listVirtualRouters(token);
          const found = routers.find((r) => r.name.toLowerCase() === input.router_name!.toLowerCase());
          if (!found) throw new Error(`Роутер "${input.router_name}" не найден`);
          return found.id;
        };

        switch (input.action) {
          case "list": {
            const routers = await tw.listVirtualRouters(token);
            return routers.map((r) => ({
              id: r.id,
              name: r.name,
              status: r.status,
              location: r.location,
              availability_zone: r.availability_zone,
              public_ip: r.public_ip,
              created_at: r.created_at,
            }));
          }
          case "get": {
            const routerId = await resolveRouterId();
            const r = await tw.getVirtualRouter(token, routerId);
            return {
              id: r.id,
              name: r.name,
              status: r.status,
              location: r.location,
              availability_zone: r.availability_zone,
              description: r.description,
              public_ip: r.public_ip,
              created_at: r.created_at,
            };
          }
          case "create": {
            const r = await tw.createVirtualRouter(token, {
              name: input.name!,
              location: input.location,
              availability_zone: input.availability_zone,
              description: input.description,
            });
            return {
              id: r.id,
              name: r.name,
              message: `Виртуальный роутер "${r.name}" создаётся`,
            };
          }
          case "delete": {
            const routerId = await resolveRouterId();
            await tw.deleteVirtualRouter(token, routerId);
            return {
              success: true,
              message: `Виртуальный роутер ${routerId} удалён`,
            };
          }
        }
      },
    }),
  };
}
