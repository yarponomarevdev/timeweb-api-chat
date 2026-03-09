import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createBucketTools(token: string) {
  return {
    list_buckets: tool({
      description: "Показать список S3-бакетов (объектное хранилище)",
      inputSchema: z.object({}),
      execute: async () => {
        const buckets = await tw.listBuckets(token);
        return { buckets: buckets.map((b) => ({
          id: b.id,
          name: b.name,
          type: b.type,
          object_amount: b.object_amount,
          size_gb: Math.round(b.size / 1024 / 1024 / 1024 * 100) / 100,
          location: b.location,
          status: b.status,
        })) };
      },
    }),
  };
}
