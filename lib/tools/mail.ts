import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createMailTools(token: string) {
  return {
    mail_domains: tool({
      description:
        "Управление почтовыми доменами: list (список), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "create", "delete"]).describe("Действие"),
        fqdn: z.string().optional().describe("Доменное имя для почты (для create)"),
        domain_id: z.number().optional().describe("ID почтового домена (для delete)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const domains = await tw.listMailDomains(token);
            return domains.map((d) => ({
              id: d.id,
              fqdn: d.fqdn,
              is_confirmed: d.is_confirmed,
              linked_ip: d.linked_ip,
              mailboxes_count: d.mailboxes_count,
              created_at: d.created_at,
            }));
          }
          case "create": {
            const d = await tw.createMailDomain(token, { fqdn: input.fqdn! });
            return {
              id: d.id,
              fqdn: d.fqdn,
              is_confirmed: d.is_confirmed,
              message: `Почтовый домен "${d.fqdn}" создан`,
            };
          }
          case "delete": {
            await tw.deleteMailDomain(token, input.domain_id!);
            return {
              success: true,
              message: `Почтовый домен ${input.domain_id!} удалён`,
            };
          }
        }
      },
    }),

    mailboxes: tool({
      description:
        "Управление почтовыми ящиками: list (список), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "create", "delete"]).describe("Действие"),
        domain_id: z.number().optional().describe("ID почтового домена (для list, create, delete)"),
        email: z.string().optional().describe("Адрес электронной почты (для create)"),
        password: z.string().optional().describe("Пароль для ящика (для create)"),
        comment: z.string().optional().describe("Комментарий (для create)"),
        mailbox_id: z.number().optional().describe("ID почтового ящика (для delete)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const mailboxes = await tw.listMailboxes(token, input.domain_id!);
            return mailboxes.map((m) => ({
              id: m.id,
              email: m.email,
              fqdn: m.fqdn,
              comment: m.comment,
              usage: m.usage,
              quota: m.quota,
              spam_filter: m.spam_filter,
              created_at: m.created_at,
            }));
          }
          case "create": {
            const m = await tw.createMailbox(token, input.domain_id!, {
              email: input.email!,
              password: input.password!,
              comment: input.comment,
            });
            return {
              id: m.id,
              email: m.email,
              fqdn: m.fqdn,
              message: `Почтовый ящик "${m.email}" создан`,
            };
          }
          case "delete": {
            await tw.deleteMailbox(token, input.domain_id!, input.mailbox_id!);
            return {
              success: true,
              message: `Почтовый ящик ${input.mailbox_id!} удалён`,
            };
          }
        }
      },
    }),
  };
}
