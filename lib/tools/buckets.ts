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
    buckets: tool({
      description: "Управление S3-бакетами: list, get, create, delete",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete"]).describe("Действие"),
        bucket_id: z.number().optional().describe("ID бакета (для get/delete)"),
        bucket_name: z.string().optional().describe("Имя бакета (для get/delete)"),
        name: z.string().optional().describe("Название бакета (для create)"),
        type: z.enum(["private", "public"]).optional().describe("Тип бакета (для create)"),
        location: z.string().optional().describe("Локация (для create)"),
      }),
      execute: async (input) => {
        const resolveBucketId = async () => {
          if (input.bucket_id) return input.bucket_id;
          if (!input.bucket_name) throw new Error("Нужен bucket_id или bucket_name");
          const buckets = await tw.listBuckets(token);
          const found = buckets.find((b) => b.name.toLowerCase() === input.bucket_name!.toLowerCase());
          if (!found) throw new Error(`Бакет "${input.bucket_name}" не найден`);
          return found.id;
        };

        switch (input.action) {
          case "list": {
            const buckets = await tw.listBuckets(token);
            return buckets.map((b) => ({
              id: b.id,
              name: b.name,
              type: b.type,
              object_amount: b.object_amount,
              size_gb: Math.round((b.size / 1024 / 1024 / 1024) * 100) / 100,
              location: b.location,
              status: b.status,
            }));
          }
          case "get": {
            const bucketId = await resolveBucketId();
            const b = await tw.getBucket(token, bucketId);
            return {
              id: b.id,
              name: b.name,
              type: b.type,
              object_amount: b.object_amount,
              size_gb: Math.round((b.size / 1024 / 1024 / 1024) * 100) / 100,
              location: b.location,
              status: b.status,
              created_at: b.created_at,
            };
          }
          case "create": {
            const b = await tw.createBucket(token, {
              name: input.name!,
              type: input.type,
              location: input.location,
            });
            return {
              id: b.id,
              name: b.name,
              type: b.type,
              hostname: b.hostname,
              access_key: b.access_key,
              secret_key: b.secret_key,
              location: b.location,
              s3_endpoint: `https://s3.timeweb.cloud`,
              message: `Бакет "${b.name}" создан`,
            };
          }
          case "delete": {
            const bucketId = await resolveBucketId();
            await tw.deleteBucket(token, bucketId);
            return {
              success: true,
              message: `Бакет ${bucketId} удалён`,
            };
          }
        }
      },
    }),
  };
}
