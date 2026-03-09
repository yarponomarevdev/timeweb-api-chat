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
  };
}
