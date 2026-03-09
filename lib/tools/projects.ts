import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createProjectTools(token: string) {
  return {
    projects: tool({
      description:
        "Управление проектами: list (список), get (детали), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete"]).describe("Действие"),
        project_id: z.number().optional().describe("ID проекта (для get, delete)"),
        name: z.string().optional().describe("Имя проекта (для create)"),
        description: z.string().optional().describe("Описание проекта (для create)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const projects = await tw.listProjects(token);
            return projects.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              is_default: p.is_default,
              created_at: p.created_at,
            }));
          }
          case "get": {
            const p = await tw.getProject(token, input.project_id!);
            return {
              id: p.id,
              name: p.name,
              description: p.description,
              is_default: p.is_default,
              created_at: p.created_at,
            };
          }
          case "create": {
            const p = await tw.createProject(token, {
              name: input.name!,
              description: input.description,
            });
            return {
              id: p.id,
              name: p.name,
              description: p.description,
              message: `Проект "${p.name}" создан`,
            };
          }
          case "delete": {
            await tw.deleteProject(token, input.project_id!);
            return {
              success: true,
              message: `Проект ${input.project_id} удалён`,
            };
          }
        }
      },
    }),

    project_resources: tool({
      description:
        "Управление ресурсами проекта: list (список ресурсов), add (добавить ресурс), remove (убрать ресурс)",
      inputSchema: z.object({
        action: z.enum(["list", "add", "remove"]).describe("Действие"),
        project_id: z.number().optional().describe("ID проекта (для list, add, remove)"),
        resource_id: z.number().optional().describe("ID ресурса (для add, remove)"),
        resource_type: z.string().optional().describe("Тип ресурса, server/balancer/database и др. (для add, remove)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const resources = await tw.listProjectResources(token, input.project_id!);
            return resources.map((r) => ({
              id: r.id,
              type: r.type,
              name: r.name,
              status: r.status,
            }));
          }
          case "add": {
            await tw.addResourceToProject(token, input.project_id!, input.resource_id!, input.resource_type!);
            return {
              success: true,
              message: `Ресурс ${input.resource_type} #${input.resource_id} добавлен в проект ${input.project_id}`,
            };
          }
          case "remove": {
            await tw.removeResourceFromProject(token, input.project_id!, input.resource_id!, input.resource_type!);
            return {
              success: true,
              message: `Ресурс ${input.resource_type} #${input.resource_id} убран из проекта ${input.project_id}`,
            };
          }
        }
      },
    }),
  };
}
