import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";

export function createImageTools(token: string) {
  return {
    images: tool({
      description:
        "Управление образами дисков: list (список), get (детали), create (создать), delete (удалить), download_url (получить ссылку для скачивания)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete", "download_url"]).describe("Действие"),
        image_id: z.string().optional().describe("ID образа (для get, delete, download_url)"),
        description: z.string().optional().describe("Описание образа (для create)"),
        disk_id: z.number().optional().describe("ID диска для создания образа (для create)"),
        upload_url: z.string().optional().describe("URL для загрузки образа (для create)"),
        location: z.string().optional().describe("Локация (для create)"),
        os: z.string().optional().describe("Операционная система (для create)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const images = await tw.listImages(token);
            return images.map((img) => ({
              id: img.id,
              name: img.name,
              description: img.description,
              status: img.status,
              size_mb: Math.round(img.size / 1024 / 1024),
              os: img.os,
              location: img.location,
              progress: img.progress,
              created_at: img.created_at,
            }));
          }
          case "get": {
            const img = await tw.getImage(token, input.image_id!);
            return {
              id: img.id,
              name: img.name,
              description: img.description,
              status: img.status,
              size_mb: Math.round(img.size / 1024 / 1024),
              os: img.os,
              disk_id: img.disk_id,
              location: img.location,
              progress: img.progress,
              created_at: img.created_at,
            };
          }
          case "create": {
            const img = await tw.createImage(token, {
              description: input.description,
              disk_id: input.disk_id,
              upload_url: input.upload_url,
              location: input.location,
              os: input.os,
            });
            return {
              id: img.id,
              name: img.name,
              status: img.status,
              message: "Образ создаётся",
            };
          }
          case "delete": {
            await tw.deleteImage(token, input.image_id!);
            return {
              success: true,
              message: `Образ ${input.image_id!} удалён`,
            };
          }
          case "download_url": {
            const download = await tw.createImageDownloadURL(token, input.image_id!);
            return {
              id: download.id,
              url: download.url,
              type: download.type,
              created_at: download.created_at,
              message: "Ссылка для скачивания образа создана",
            };
          }
        }
      },
    }),
  };
}
