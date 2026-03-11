import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createDomainTools(token: string) {
  return {
    list_domains: tool({
      description: "Показать список доменов аккаунта",
      inputSchema: z.object({}),
      execute: async () => {
        const domains = await tw.listDomains(token);
        return { domains: domains.map((d) => ({
          id: d.id,
          name: d.fqdn || d.name,
          expiration: d.expiration,
          days_left: d.days_left,
          provider: d.provider,
          is_autoprolong: d.is_autoprolong,
        })) };
      },
    }),
    domains: tool({
      description: "Управление доменами: list, get, create, delete",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete"]).describe("Действие"),
        domain_id: z.number().optional().describe("ID домена (для get/delete)"),
        domain_name: z.string().optional().describe("Имя домена (для get/delete), например example.ru"),
        fqdn: z.string().optional().describe("Доменное имя, например example.ru (для create)"),
        is_autoprolong: z.boolean().optional().describe("Автопродление (для create)"),
      }),
      execute: async (input) => {
        const resolveDomainFqdn = async () => {
          if (input.domain_name) return input.domain_name;
          if (!input.domain_id) throw new Error("Нужен domain_id или domain_name");
          const domains = await tw.listDomains(token);
          const found = domains.find((d) => d.id === input.domain_id);
          if (!found) throw new Error(`Домен с ID ${input.domain_id} не найден`);
          return found.fqdn || found.name;
        };

        switch (input.action) {
          case "list": {
            const domains = await tw.listDomains(token);
            return domains.map((d) => ({
              id: d.id,
              name: d.fqdn || d.name,
              expiration: d.expiration,
              days_left: d.days_left,
              provider: d.provider,
              is_autoprolong: d.is_autoprolong,
            }));
          }
          case "get": {
            const fqdn = await resolveDomainFqdn();
            const d = await tw.getDomain(token, fqdn);
            return {
              id: d.id,
              name: d.fqdn || d.name,
              expiration: d.expiration,
              paid_till: d.paid_till,
              days_left: d.days_left,
              provider: d.provider,
              is_autoprolong: d.is_autoprolong,
              is_premium: d.is_premium,
            };
          }
          case "create": {
            const d = await tw.createDomain(token, {
              fqdn: input.fqdn!,
              is_autoprolong: input.is_autoprolong,
            });
            return {
              id: d.id,
              name: d.fqdn || d.name,
              message: `Домен "${d.fqdn || d.name}" создан`,
            };
          }
          case "delete": {
            const fqdn = await resolveDomainFqdn();
            await tw.deleteDomain(token, fqdn);
            return {
              success: true,
              message: `Домен ${fqdn} удалён`,
            };
          }
        }
      },
    }),
  };
}
