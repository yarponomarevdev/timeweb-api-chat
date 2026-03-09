import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createNetworkDriveTools(token: string) {
  return {
    network_drives: tool({
      description:
        "Управление сетевыми дисками: list (список), get (детали), create (создать), delete (удалить), mount (подключить к серверу), unmount (отключить от сервера)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete", "mount", "unmount"]).describe("Действие"),
        drive_id: z.number().optional().describe("ID сетевого диска (для get, delete, mount, unmount)"),
        name: z.string().optional().describe("Имя диска (для create)"),
        size: z.number().optional().describe("Размер в ГБ (для create)"),
        comment: z.string().optional().describe("Комментарий (для create)"),
        availability_zone: z.string().optional().describe("Зона размещения (для create)"),
        server_id: z.number().optional().describe("ID сервера для подключения (для mount)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const drives = await tw.listNetworkDrives(token);
            return drives.map((d) => ({
              id: d.id,
              name: d.name,
              status: d.status,
              size: d.size,
              used: d.used,
              type: d.type,
              linked_service: d.linked_service
                ? `${d.linked_service.type} "${d.linked_service.name}" (#${d.linked_service.id})`
                : null,
              location: d.location,
              created_at: d.created_at,
            }));
          }
          case "get": {
            const d = await tw.getNetworkDrive(token, input.drive_id!);
            return {
              id: d.id,
              name: d.name,
              comment: d.comment,
              status: d.status,
              size: d.size,
              used: d.used,
              type: d.type,
              preset_id: d.preset_id,
              linked_service: d.linked_service,
              location: d.location,
              availability_zone: d.availability_zone,
              created_at: d.created_at,
            };
          }
          case "create": {
            const d = await tw.createNetworkDrive(token, {
              name: input.name!,
              size: input.size!,
              comment: input.comment,
              availability_zone: input.availability_zone,
            });
            return {
              id: d.id,
              name: d.name,
              size: d.size,
              status: d.status,
              message: `Сетевой диск "${d.name}" создаётся`,
            };
          }
          case "delete": {
            await tw.deleteNetworkDrive(token, input.drive_id!);
            return {
              success: true,
              message: `Сетевой диск ${input.drive_id!} удалён`,
            };
          }
          case "mount": {
            await tw.mountNetworkDrive(token, input.drive_id!, input.server_id!);
            return {
              success: true,
              message: `Сетевой диск ${input.drive_id!} подключён к серверу ${input.server_id!}`,
            };
          }
          case "unmount": {
            await tw.unmountNetworkDrive(token, input.drive_id!);
            return {
              success: true,
              message: `Сетевой диск ${input.drive_id!} отключён`,
            };
          }
        }
      },
    }),
  };
}
