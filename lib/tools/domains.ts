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
        const resolveDomainId = async () => {
          if (input.domain_id) return input.domain_id;
          if (!input.domain_name) throw new Error("Нужен domain_id или domain_name");
          const domains = await tw.listDomains(token);
          const found = domains.find(
            (d) => (d.fqdn || d.name).toLowerCase() === input.domain_name!.toLowerCase()
          );
          if (!found) throw new Error(`Домен "${input.domain_name}" не найден`);
          return found.id;
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
            const domainId = await resolveDomainId();
            const d = await tw.getDomain(token, domainId);
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
            const domainId = await resolveDomainId();
            await tw.deleteDomain(token, domainId);
            return {
              success: true,
              message: `Домен ${domainId} удалён`,
            };
          }
        }
      },
    }),
  };
}
