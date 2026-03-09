import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createMiscTools(token: string) {
  return {
    list_locations: tool({
      description: "Получить список доступных локаций (дата-центров)",
      inputSchema: z.object({}),
      execute: async () => {
        const locations = await tw.listLocations(token);
        const LOCATION_LABELS: Record<string, { city: string; country: string }> = {
          "ru-1": { city: "Санкт-Петербург", country: "Россия" },
          "ru-2": { city: "Новосибирск", country: "Россия" },
          "ru-3": { city: "Москва", country: "Россия" },
          "pl-1": { city: "Гданьск", country: "Польша" },
          "kz-1": { city: "Алматы", country: "Казахстан" },
          "nl-1": { city: "Амстердам", country: "Нидерланды" },
          "us-2": { city: "Нью-Йорк", country: "США" },
          "de-1": { city: "Франкфурт", country: "Германия" },
        };
        return locations.map((loc) => {
          const label = LOCATION_LABELS[loc.location] ?? { city: loc.location, country: loc.location_code };
          return {
            id: loc.location,
            city: label.city,
            country: label.country,
            availability_zones: loc.availability_zones,
          };
        });
      },
    }),

    api_keys: tool({
      description:
        "Управление API-ключами: list (список), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "create", "delete"]).describe("Действие"),
        name: z.string().optional().describe("Имя API-ключа (для create)"),
        expires_at: z.string().optional().describe("Дата истечения ISO 8601 (для create)"),
        key_id: z.string().optional().describe("ID API-ключа (для delete)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const keys = await tw.listAPIKeys(token);
            return keys.map((k) => ({
              id: k.id,
              name: k.name,
              created_at: k.created_at,
              expires_at: k.expires_at,
            }));
          }
          case "create": {
            const k = await tw.createAPIKey(token, {
              name: input.name!,
              expires_at: input.expires_at,
            });
            return {
              id: k.id,
              name: k.name,
              token: k.token,
              expires_at: k.expires_at,
              message: `API-ключ "${k.name}" создан`,
            };
          }
          case "delete": {
            await tw.deleteAPIKey(token, input.key_id!);
            return {
              success: true,
              message: `API-ключ ${input.key_id!} удалён`,
            };
          }
        }
      },
    }),

    account_info: tool({
      description:
        "Информация об аккаунте: status (статус аккаунта), notifications (настройки уведомлений)",
      inputSchema: z.object({
        action: z.enum(["status", "notifications"]).describe("Действие"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "status": {
            const s = await tw.getAccountStatus(token);
            return {
              is_blocked: s.is_blocked,
              is_permanent_blocked: s.is_permanent_blocked,
              company_info: s.company_info,
              last_password_changed_at: s.last_password_changed_at,
            };
          }
          case "notifications": {
            const settings = await tw.listNotificationSettings(token);
            return settings.map((n) => ({
              id: n.id,
              type: n.type,
              channel: n.channel,
              is_enabled: n.is_enabled,
            }));
          }
        }
      },
    }),
    timeweb_api_universal: tool({
      description:
        "Универсальный доступ к Timeweb API. Используй, если нужной операции нет в специализированных tools.",
      inputSchema: z.object({
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP метод"),
        path: z.string().describe("Путь API без домена, например /vpcs или /servers/123"),
        version: z.enum(["v1", "v2"]).optional().describe("Версия API, по умолчанию v1"),
        query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe("Query-параметры"),
        body: z.record(z.string(), z.unknown()).optional().describe("JSON body для POST/PUT/PATCH"),
      }),
      execute: async ({ method, path, version, query, body }) => {
        if (!path.startsWith("/")) {
          throw new Error("path должен начинаться с '/'");
        }
        if (path.startsWith("http://") || path.startsWith("https://")) {
          throw new Error("Передай только путь API, без домена");
        }

        const search = query ? new URLSearchParams(
          Object.entries(query).map(([k, v]) => [k, String(v)])
        ).toString() : "";
        const fullPath = search ? `${path}?${search}` : path;

        const payload =
          method === "GET" || method === "DELETE"
            ? undefined
            : body ?? {};

        const data = await tw.apiRequest<unknown>(
          fullPath,
          token,
          {
            method,
            ...(payload ? { body: JSON.stringify(payload) } : {}),
          },
          version ?? "v1"
        );

        return {
          method,
          path: fullPath,
          version: version ?? "v1",
          data,
        };
      },
    }),
  };
}
