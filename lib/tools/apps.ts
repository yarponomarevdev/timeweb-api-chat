import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createAppTools(token: string) {
  return {
    apps: tool({
      description:
        "Управление приложениями (PaaS): list (список), get (детали), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete"]).describe("Действие"),
        app_id: z.number().optional().describe("ID приложения (для get, delete)"),
        name: z.string().optional().describe("Имя приложения (для create)"),
        type: z.string().optional().describe("Тип приложения, backend/frontend и др. (для create)"),
        preset_id: z.number().optional().describe("ID тарифа (для create)"),
        provider_type: z.string().optional().describe("Тип провайдера, github/gitlab (для create)"),
        provider_branch: z.string().optional().describe("Ветка репозитория (для create)"),
        provider_repository: z.string().optional().describe("URL или имя репозитория (для create)"),
        framework: z.string().optional().describe("Фреймворк, nodejs/python и др. (для create)"),
        envs: z.record(z.string(), z.string()).optional().describe("Переменные окружения (для create)"),
        comment: z.string().optional().describe("Комментарий (для create)"),
        availability_zone: z.string().optional().describe("Зона размещения (для create)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const apps = await tw.listApps(token);
            return apps.map((a) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              status: a.status,
              framework: a.framework,
              repository: a.provider?.repository ?? "—",
              domains: a.domains,
              location: a.location,
              created_at: a.created_at,
            }));
          }
          case "get": {
            const a = await tw.getApp(token, input.app_id!);
            return {
              id: a.id,
              name: a.name,
              type: a.type,
              status: a.status,
              preset_id: a.preset_id,
              framework: a.framework,
              provider: a.provider,
              envs: a.envs,
              domains: a.domains,
              location: a.location,
              comment: a.comment,
              created_at: a.created_at,
            };
          }
          case "create": {
            const a = await tw.createApp(token, {
              name: input.name!,
              type: input.type!,
              preset_id: input.preset_id!,
              provider: {
                type: input.provider_type!,
                branch: input.provider_branch!,
                repository: input.provider_repository!,
              },
              framework: input.framework,
              envs: input.envs as Record<string, string> | undefined,
              comment: input.comment,
              availability_zone: input.availability_zone,
            });
            return {
              id: a.id,
              name: a.name,
              status: a.status,
              framework: a.framework,
              domains: a.domains,
              location: a.location,
              message: `Приложение "${a.name}" создаётся`,
            };
          }
          case "delete": {
            await tw.deleteApp(token, input.app_id!);
            return {
              success: true,
              message: `Приложение ${input.app_id!} удалено`,
            };
          }
        }
      },
    }),

    app_deploys: tool({
      description:
        "Управление деплоями приложения: list (список деплоев), trigger (запустить новый деплой)",
      inputSchema: z.object({
        action: z.enum(["list", "trigger"]).describe("Действие"),
        app_id: z.number().optional().describe("ID приложения (для list, trigger)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const deploys = await tw.listAppDeploys(token, input.app_id!);
            return deploys.map((d) => ({
              id: d.id,
              status: d.status,
              commit: d.commit,
              comment: d.comment,
              created_at: d.created_at,
            }));
          }
          case "trigger": {
            const d = await tw.triggerAppDeploy(token, input.app_id!);
            return {
              id: d.id,
              status: d.status,
              message: "Деплой запущен",
            };
          }
        }
      },
    }),
  };
}
