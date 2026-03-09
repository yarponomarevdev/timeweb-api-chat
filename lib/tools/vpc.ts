import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";
import type { TimewebVPCService } from "@/types/timeweb/vpc";

export function createVPCTools(token: string) {
  return {
    vpcs: tool({
      description:
        "Управление виртуальными частными сетями (VPC): list (список), get (детали), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete"]).describe("Действие"),
        vpc_id: z.string().optional().describe("ID VPC (для get, delete)"),
        name: z.string().optional().describe("Имя VPC (для create)"),
        subnet_v4: z.string().optional().describe("Подсеть IPv4, например 10.0.0.0/24 (для create)"),
        location: z.string().optional().describe("Локация (для create)"),
        availability_zone: z.string().optional().describe("Зона размещения (для create)"),
        description: z.string().optional().describe("Описание (для create)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const vpcs = await tw.listVPCs(token);
            return vpcs.map((v) => ({
              id: v.id,
              name: v.name,
              subnet_v4: v.subnet_v4,
              location: v.location,
              description: v.description,
              services_count: v.services?.length ?? 0,
              created_at: v.created_at,
            }));
          }
          case "get": {
            const v = await tw.getVPC(token, input.vpc_id!);
            return {
              id: v.id,
              name: v.name,
              subnet_v4: v.subnet_v4,
              location: v.location,
              availability_zone: v.availability_zone,
              description: v.description,
              created_at: v.created_at,
              services: v.services?.map((s: TimewebVPCService) => ({
                id: s.id,
                name: s.name,
                type: s.type,
                local_ip: s.local_ip,
              })) ?? [],
            };
          }
          case "create": {
            const v = await tw.createVPC(token, {
              name: input.name!,
              subnet_v4: input.subnet_v4!,
              location: input.location,
              availability_zone: input.availability_zone,
              description: input.description,
            });
            return {
              id: v.id,
              name: v.name,
              subnet_v4: v.subnet_v4,
              message: `VPC "${v.name}" создана`,
            };
          }
          case "delete": {
            await tw.deleteVPC(token, input.vpc_id!);
            return {
              success: true,
              message: `VPC ${input.vpc_id} удалена`,
            };
          }
        }
      },
    }),
  };
}
