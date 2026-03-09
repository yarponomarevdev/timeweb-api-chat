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
  };
}
