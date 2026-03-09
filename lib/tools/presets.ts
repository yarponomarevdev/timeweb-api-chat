import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";
import type { SoftwareOption } from "./software";

export interface OsOption {
  id: number;
  name: string;
  version: string;
  full_name: string;
}

export interface PresetSummary {
  id: number;
  description: string;
  cpu: number;
  ram_mb: number;
  ram_gb: number;
  disk_gb: number;
  price_per_month: number;
  bandwidth: number;
}

export interface LocationOption {
  code: string;
  city: string;
  country: string;
  flag: string;
}

export interface ProposeServerOutput {
  mode?: "os" | "software";
  server_name: string;
  preset: PresetSummary;
  selected_os?: OsOption;
  available_os: OsOption[];
  selected_software?: SoftwareOption;
  available_software?: SoftwareOption[];
  available_presets: PresetSummary[];
  selected_location: string;
  available_locations: LocationOption[];
}

export interface BalanceOutput {
  balance: number;
  currency: string;
  total: number;
  promocode_balance: number;
  hours_left: number | null;
  days_left: number | null;
  end_date: string | null;
  is_blocked: boolean;
  penalty: number;
}

export function createPresetTools(token: string) {
  return {
    propose_server: tool({
      description:
        "Подготовить предложение конфигурации нового сервера. Используй ТОЛЬКО этот tool при создании сервера — он сам подберёт тариф и ОС без показа таблицы тарифов.",
      inputSchema: z.object({
        name: z.string().describe("Имя будущего сервера"),
        os_query: z
          .string()
          .describe("Название ОС, например 'ubuntu', 'debian', 'centos'"),
        ram_mb: z
          .number()
          .optional()
          .describe("Желаемый размер RAM в МБ (например 2048 для 2 GB)"),
      }),
      execute: async ({ name, os_query, ram_mb }) => {
        const [presets, osList] = await Promise.all([
          tw.listPresets(token),
          tw.listOS(token),
        ]);

        const targetRam = ram_mb ?? 2048;
        const matching = presets.filter((p) => p.ram === targetRam);
        const preset = (matching.length > 0 ? matching : presets)
          .sort((a, b) => a.price - b.price)[0];

        const query = os_query.toLowerCase();
        const matchingOs = osList.filter((os) => {
          const fullName = `${os.name} ${os.version}`.toLowerCase();
          return fullName.includes(query) || os.name.toLowerCase().includes(query);
        });
        const stableOs = matchingOs.filter(
          (os) => !/alpha|beta|rc/i.test(os.version)
        );
        const pool = stableOs.length > 0 ? stableOs : matchingOs;
        const sortedPool = (pool.length > 0 ? pool : osList).sort((a, b) =>
          b.version.localeCompare(a.version, undefined, { numeric: true })
        );
        const defaultOs = sortedPool[0];

        const presetsByRamDisk = new Map<string, typeof preset>();
        for (const p of presets.sort((a, b) => a.price - b.price)) {
          const key = `${p.ram}_${p.disk}`;
          if (!presetsByRamDisk.has(key)) presetsByRamDisk.set(key, p);
        }
        const availablePresets = Array.from(presetsByRamDisk.values())
          .sort((a, b) => a.ram - b.ram || a.disk - b.disk)
          .map((p) => ({
            id: p.id,
            description: p.description_short || p.description,
            cpu: p.cpu,
            ram_mb: p.ram,
            ram_gb: Math.round(p.ram / 1024),
            disk_gb: Math.round(p.disk / 1024),
            price_per_month: p.price,
            bandwidth: p.bandwidth,
          }));

        const availableLocations: LocationOption[] = [
          { code: "ru-1", city: "Москва", country: "Россия", flag: "🇷🇺" },
          { code: "ru-2", city: "Санкт-Петербург", country: "Россия", flag: "🇷🇺" },
          { code: "pl-1", city: "Варшава", country: "Польша", flag: "🇵🇱" },
          { code: "nl-1", city: "Амстердам", country: "Нидерланды", flag: "🇳🇱" },
          { code: "kz-1", city: "Алматы", country: "Казахстан", flag: "🇰🇿" },
        ];

        return {
          server_name: name,
          preset: {
            id: preset.id,
            description: preset.description_short || preset.description,
            cpu: preset.cpu,
            ram_mb: preset.ram,
            ram_gb: Math.round(preset.ram / 1024),
            disk_gb: Math.round(preset.disk / 1024),
            price_per_month: preset.price,
            bandwidth: preset.bandwidth,
          },
          selected_os: {
            id: defaultOs.id,
            name: defaultOs.name,
            version: defaultOs.version,
            full_name: `${defaultOs.name} ${defaultOs.version}`,
          },
          available_os: matchingOs.map((os) => ({
            id: os.id,
            name: os.name,
            version: os.version,
            full_name: `${os.name} ${os.version}`,
          })),
          available_presets: availablePresets,
          selected_location: "ru-1",
          available_locations: availableLocations,
        };
      },
    }),
    propose_marketplace_server: tool({
      description:
        "Подготовить конфигурацию сервера с ПО из маркетплейса. Используй, когда пользователь просит OpenClaw, Docker, WordPress и другое ПО из маркетплейса.",
      inputSchema: z.object({
        name: z.string().describe("Имя будущего сервера"),
        software_query: z.string().describe("Название ПО из маркетплейса, например OpenClaw, Docker, WordPress"),
        ram_mb: z
          .number()
          .optional()
          .describe("Желаемый размер RAM в МБ. Если не указан, берётся минимум для ПО или 2048"),
      }),
      execute: async ({ name, software_query, ram_mb }) => {
        const [presets, softwareList] = await Promise.all([
          tw.listPresets(token),
          tw.listSoftware(token),
        ]);

        const query = software_query.toLowerCase().trim();
        const matchingSoftware = softwareList.filter((item) =>
          [item.name, item.category, item.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        );

        const selectedSoftware = (matchingSoftware[0] ?? softwareList[0]);
        if (!selectedSoftware) {
          throw new Error("В маркетплейсе не найдено подходящее ПО");
        }

        const requiredRam = Math.max(ram_mb ?? 2048, selectedSoftware.requirements?.min_ram ?? 0);
        const requiredDisk = selectedSoftware.requirements?.min_disk ?? 0;

        const matchingPresets = presets.filter(
          (p) => p.ram >= requiredRam && p.disk >= requiredDisk
        );
        const preset = (matchingPresets.length > 0 ? matchingPresets : presets)
          .sort((a, b) => a.price - b.price)[0];

        const availablePresets = presets
          .filter((p) => p.ram >= requiredRam && p.disk >= requiredDisk)
          .sort((a, b) => a.ram - b.ram || a.disk - b.disk || a.price - b.price)
          .map((p) => ({
            id: p.id,
            description: p.description_short || p.description,
            cpu: p.cpu,
            ram_mb: p.ram,
            ram_gb: Math.round(p.ram / 1024),
            disk_gb: Math.round(p.disk / 1024),
            price_per_month: p.price,
            bandwidth: p.bandwidth,
          }));

        const availableLocations: LocationOption[] = [
          { code: "ru-1", city: "Москва", country: "Россия", flag: "🇷🇺" },
          { code: "ru-2", city: "Санкт-Петербург", country: "Россия", flag: "🇷🇺" },
          { code: "pl-1", city: "Варшава", country: "Польша", flag: "🇵🇱" },
          { code: "nl-1", city: "Амстердам", country: "Нидерланды", flag: "🇳🇱" },
          { code: "kz-1", city: "Алматы", country: "Казахстан", flag: "🇰🇿" },
        ];

        return {
          mode: "software",
          server_name: name,
          preset: {
            id: preset.id,
            description: preset.description_short || preset.description,
            cpu: preset.cpu,
            ram_mb: preset.ram,
            ram_gb: Math.round(preset.ram / 1024),
            disk_gb: Math.round(preset.disk / 1024),
            price_per_month: preset.price,
            bandwidth: preset.bandwidth,
          },
          available_os: [],
          selected_software: {
            id: selectedSoftware.id,
            name: selectedSoftware.name,
            full_name: selectedSoftware.name,
            category: selectedSoftware.category ?? undefined,
            description: selectedSoftware.description ?? undefined,
            os_label: selectedSoftware.os
              ? [selectedSoftware.os.name, selectedSoftware.os.version].filter(Boolean).join(" ")
              : undefined,
            min_ram_mb: selectedSoftware.requirements?.min_ram,
            min_disk_gb: selectedSoftware.requirements?.min_disk,
          },
          available_software: matchingSoftware.map((item) => ({
            id: item.id,
            name: item.name,
            full_name: item.name,
            category: item.category ?? undefined,
            description: item.description ?? undefined,
            os_label: item.os ? [item.os.name, item.os.version].filter(Boolean).join(" ") : undefined,
            min_ram_mb: item.requirements?.min_ram,
            min_disk_gb: item.requirements?.min_disk,
          })),
          available_presets: availablePresets.length > 0
            ? availablePresets
            : [{
                id: preset.id,
                description: preset.description_short || preset.description,
                cpu: preset.cpu,
                ram_mb: preset.ram,
                ram_gb: Math.round(preset.ram / 1024),
                disk_gb: Math.round(preset.disk / 1024),
                price_per_month: preset.price,
                bandwidth: preset.bandwidth,
              }],
          selected_location: "ru-1",
          available_locations: availableLocations,
        } satisfies ProposeServerOutput;
      },
    }),

    list_presets: tool({
      description:
        "Показать список доступных тарифов. Используй ТОЛЬКО когда пользователь явно просит показать тарифы — НЕ при создании сервера.",
      inputSchema: z.object({
        ram_mb: z
          .number()
          .optional()
          .describe("Фильтр по оперативной памяти в МБ"),
      }),
      execute: async ({ ram_mb }) => {
        const presets = await tw.listPresets(token);
        const filtered = ram_mb
          ? presets.filter((p) => p.ram === ram_mb)
          : presets;
        return filtered.map((p) => ({
          id: p.id,
          cpu: p.cpu,
          ram_mb: p.ram,
          ram_gb: Math.round(p.ram / 1024),
          disk_gb: p.disk,
          bandwidth: p.bandwidth,
          price_per_month: p.price,
          description: p.description_short || p.description,
        }));
      },
    }),

    list_os: tool({
      description:
        "Показать список ОС. Используй ТОЛЬКО когда пользователь явно просит список ОС — НЕ при создании сервера (для этого есть propose_server).",
      inputSchema: z.object({
        search: z.string().optional().describe("Поиск по названию ОС"),
      }),
      execute: async ({ search }) => {
        const osList = await tw.listOS(token);
        const filtered = search
          ? osList.filter(
              (os) =>
                os.name.toLowerCase().includes(search.toLowerCase()) ||
                os.version.toLowerCase().includes(search.toLowerCase())
            )
          : osList;
        return filtered.map((os) => ({
          id: os.id,
          name: os.name,
          version: os.version,
          family: os.family,
          full_name: `${os.name} ${os.version}`,
        }));
      },
    }),

    get_balance: tool({
      description: "Получить текущий баланс и финансовую информацию аккаунта",
      inputSchema: z.object({}),
      execute: async () => {
        const finances = await tw.getBalance(token);
        const hoursLeft = finances.hours_left;
        const daysLeft = hoursLeft != null ? Math.floor(hoursLeft / 24) : null;
        const endDate = hoursLeft != null
          ? new Date(Date.now() + hoursLeft * 3600 * 1000).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
          : null;
        return {
          balance: finances.balance,
          currency: finances.currency ?? "RUB",
          total: finances.total,
          promocode_balance: finances.promocode_balance,
          hours_left: hoursLeft,
          days_left: daysLeft,
          end_date: endDate,
          is_blocked: finances.is_blocked,
          penalty: finances.penalty,
        };
      },
    }),
  };
}
