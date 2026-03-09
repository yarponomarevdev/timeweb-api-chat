import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

/** Убирает HTML-теги и нормализует пробелы */
export function stripHtml(html: string | null | undefined): string | undefined {
  if (!html) return undefined;
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  // API иногда возвращает ключи локализации вместо текста
  if (text.startsWith("servers.ext-software-description")) return undefined;
  return text || undefined;
}

export interface SoftwareOption {
  id: number;
  name: string;
  full_name: string;
  category?: string;
  description?: string;
  os_label?: string;
  min_ram_mb?: number;
  min_disk_gb?: number;
}

export function createSoftwareTools(token: string) {
  return {
    software: tool({
      description:
        "Каталог ПО из маркетплейса для облачных серверов: list (список), get (детали)",
      inputSchema: z.object({
        action: z.enum(["list", "get"]).describe("Действие"),
        software_id: z.number().optional().describe("ID ПО (для get)"),
        search: z.string().optional().describe("Поиск по названию ПО"),
      }),
      execute: async ({ action, software_id, search }) => {
        if (action === "list") {
          const items = await tw.listSoftware(token);
          const normalizedSearch = search?.toLowerCase().trim();
          const filtered = normalizedSearch
            ? items.filter((item) =>
                [item.name, item.category, item.description]
                  .filter(Boolean)
                  .some((value) => String(value).toLowerCase().includes(normalizedSearch))
              )
            : items;

          return filtered.map((item) => ({
            id: item.id,
            name: item.name,
            full_name: item.name,
            category: item.category ?? undefined,
            description: stripHtml(item.description),
            os_label: item.os ? [item.os.name, item.os.version].filter(Boolean).join(" ") : undefined,
            min_ram_mb: item.requirements?.min_ram,
            min_disk_gb: item.requirements?.min_disk,
          }));
        }

        const item = await tw.getSoftware(token, software_id!);
        return {
          id: item.id,
          name: item.name,
          full_name: item.name,
          category: item.category ?? undefined,
          description: stripHtml(item.description),
          os_label: item.os ? [item.os.name, item.os.version].filter(Boolean).join(" ") : undefined,
          install_time: item.install_time ?? undefined,
          min_ram_mb: item.requirements?.min_ram,
          min_disk_gb: item.requirements?.min_disk,
        };
      },
    }),
  };
}
