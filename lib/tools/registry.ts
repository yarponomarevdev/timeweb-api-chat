import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";
import type { TimewebRegistryRepository } from "@/types/timeweb/registry";

export function createRegistryTools(token: string) {
  return {
    container_registry: tool({
      description:
        "Управление Docker-реестрами контейнеров: list (список), get (детали), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete"]).describe("Действие"),
        registry_id: z.number().optional().describe("ID реестра (для get, delete)"),
        name: z.string().optional().describe("Имя реестра (для create)"),
        location: z.string().optional().describe("Локация (для create)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const registries = await tw.listRegistries(token);
            return registries.map((r) => ({
              id: r.id,
              name: r.name,
              status: r.status,
              endpoint: r.endpoint,
              location: r.location,
              repositories_count: r.repositories?.length ?? 0,
              created_at: r.created_at,
            }));
          }
          case "get": {
            const r = await tw.getRegistry(token, input.registry_id!);
            return {
              id: r.id,
              name: r.name,
              status: r.status,
              location: r.location,
              login: r.login,
              password: r.password,
              endpoint: r.endpoint,
              created_at: r.created_at,
              repositories: r.repositories?.map((repo: TimewebRegistryRepository) => ({
                name: repo.name,
                tags_count: repo.tags_count,
                size_mb: Math.round(repo.size / 1024 / 1024),
              })) ?? [],
            };
          }
          case "create": {
            const r = await tw.createRegistry(token, {
              name: input.name!,
              location: input.location,
            });
            return {
              id: r.id,
              name: r.name,
              status: r.status,
              endpoint: r.endpoint,
              login: r.login,
              password: r.password,
              message: `Docker-реестр "${r.name}" создан`,
            };
          }
          case "delete": {
            await tw.deleteRegistry(token, input.registry_id!);
            return {
              success: true,
              message: `Docker-реестр ${input.registry_id!} удалён`,
            };
          }
        }
      },
    }),
  };
}
