import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export interface SSHKeySummary {
  id: number;
  name: string;
  fingerprint: string;
  created_at: string;
  used_at: string | null;
}

export interface CreateSSHKeyOutput extends SSHKeySummary {
  message: string;
}

export interface DeleteSSHKeyOutput {
  success: true;
  message: string;
}

export function createSSHKeyTools(token: string) {
  return {
    list_ssh_keys: tool({
      description: "Показать список SSH-ключей в аккаунте evolvin.cloud",
      inputSchema: z.object({}),
      execute: async () => {
        const keys = await tw.listSSHKeys(token);
        return keys.map((k) => ({
          id: k.id,
          name: k.name,
          fingerprint: k.fingerprint,
          created_at: k.created_at,
          used_at: k.used_at,
        }));
      },
    }),

    create_ssh_key: tool({
      description: "Добавить SSH-ключ в аккаунт evolvin.cloud",
      inputSchema: z.object({
        name: z.string().describe("Название ключа"),
        body: z.string().describe("Публичный ключ (содержимое файла .pub)"),
      }),
      execute: async ({ name, body }) => {
        const key = await tw.createSSHKey(token, { name, body });
        return {
          id: key.id,
          name: key.name,
          fingerprint: key.fingerprint,
          created_at: key.created_at,
          used_at: key.used_at,
          message: `SSH-ключ "${key.name}" успешно добавлен`,
        };
      },
    }),

    delete_ssh_key: tool({
      description: "Удалить SSH-ключ из аккаунта evolvin.cloud по его ID",
      inputSchema: z
        .object({
          key_id: z.number().optional().describe("ID SSH-ключа"),
          id: z.number().optional().describe("Альтернативное поле ID SSH-ключа"),
          key_name: z.string().optional().describe("Имя ключа для подтверждения"),
        })
        .refine((v) => v.key_id != null || v.id != null, {
          message: "Нужно передать key_id или id",
        })
        .transform(({ key_id, id, ...rest }) => ({
          ...rest,
          key_id: key_id ?? id!,
        })),
      execute: async ({ key_id, key_name }) => {
        await tw.deleteSSHKey(token, key_id);
        return {
          success: true as const,
          message: `SSH-ключ ${key_name ? `"${key_name}"` : `#${key_id}`} удалён`,
        };
      },
    }),
  };
}
