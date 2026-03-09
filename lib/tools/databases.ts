import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createDatabaseTools(token: string) {
  return {
    list_databases: tool({
      description: "Показать список баз данных аккаунта",
      inputSchema: z.object({}),
      execute: async () => {
        const dbs = await tw.listDatabases(token);
        return { databases: dbs.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          status: d.status,
          location: d.location,
          created_at: d.created_at,
        })) };
      },
    }),

    create_database: tool({
      description: "Создать базу данных. Обязательно: имя, тип (mysql8, pgsql, redis), пароль. preset_id — из системы по умолчанию минимальный.",
      inputSchema: z.object({
        name: z.string().describe("Имя базы данных"),
        type: z.string().describe("Тип БД: mysql8, pgsql, redis"),
        password: z.string().describe("Пароль для доступа"),
        preset_id: z.number().optional().describe("ID тарифа базы данных (необязательно)"),
      }),
      execute: async ({ name, type, password, preset_id }) => {
        const db = await tw.createDatabase(token, {
          name,
          type,
          password,
          preset_id: preset_id ?? 1,
        });
        return { database: { id: db.id, name: db.name, type: db.type, status: db.status } };
      },
    }),
    databases: tool({
      description: "Управление базами данных: list, get, create, delete",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete"]).describe("Действие"),
        database_id: z.number().optional().describe("ID базы данных (для get/delete)"),
        database_name: z.string().optional().describe("Имя базы данных (для get/delete)"),
        name: z.string().optional().describe("Имя базы данных (для create)"),
        type: z.string().optional().describe("Тип БД: mysql8, pgsql, redis (для create)"),
        password: z.string().optional().describe("Пароль для доступа (для create)"),
        preset_id: z.number().optional().describe("ID тарифа БД (для create)"),
      }),
      execute: async (input) => {
        const resolveDatabaseId = async () => {
          if (input.database_id) return input.database_id;
          if (!input.database_name) throw new Error("Нужен database_id или database_name");
          const dbs = await tw.listDatabases(token);
          const found = dbs.find((d) => d.name.toLowerCase() === input.database_name!.toLowerCase());
          if (!found) throw new Error(`База данных "${input.database_name}" не найдена`);
          return found.id;
        };

        switch (input.action) {
          case "list": {
            const dbs = await tw.listDatabases(token);
            return dbs.map((d) => ({
              id: d.id,
              name: d.name,
              type: d.type,
              status: d.status,
              location: d.location,
              created_at: d.created_at,
            }));
          }
          case "get": {
            const databaseId = await resolveDatabaseId();
            const d = await tw.getDatabase(token, databaseId);
            return {
              id: d.id,
              name: d.name,
              type: d.type,
              status: d.status,
              location: d.location,
              disk: d.disk,
              comment: d.comment,
              preset_id: d.preset_id,
              created_at: d.created_at,
            };
          }
          case "create": {
            const d = await tw.createDatabase(token, {
              name: input.name!,
              type: input.type!,
              password: input.password!,
              preset_id: input.preset_id ?? 1,
            });
            return {
              id: d.id,
              name: d.name,
              type: d.type,
              status: d.status,
              message: `База данных "${d.name}" создаётся`,
            };
          }
          case "delete": {
            const databaseId = await resolveDatabaseId();
            await tw.deleteDatabase(token, databaseId);
            return {
              success: true,
              message: `База данных ${databaseId} удалена`,
            };
          }
        }
      },
    }),
  };
}
