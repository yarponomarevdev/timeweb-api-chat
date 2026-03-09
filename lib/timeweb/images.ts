import { apiRequest } from "./client";
import type { TimewebImage, TimewebImageDownloadURL } from "@/types/timeweb";

export async function listImages(token: string): Promise<TimewebImage[]> {
  const data = await apiRequest<{ images: TimewebImage[] }>("/images", token);
  return data.images ?? [];
}

export async function getImage(token: string, id: string): Promise<TimewebImage> {
  const data = await apiRequest<{ image: TimewebImage }>(`/images/${id}`, token);
  return data.image;
}

export async function createImage(
  token: string,
  params: { description?: string; disk_id?: number; upload_url?: string; location?: string; os?: string }
): Promise<TimewebImage> {
  const data = await apiRequest<{ image: TimewebImage }>("/images", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.image;
}

export async function deleteImage(token: string, id: string): Promise<null> {
  return apiRequest(`/images/${id}`, token, { method: "DELETE" });
}

export async function createImageDownloadURL(
  token: string,
  imageId: string
): Promise<TimewebImageDownloadURL> {
  const data = await apiRequest<{ download: TimewebImageDownloadURL }>(
    `/images/${imageId}/download-url`,
    token,
    { method: "POST", body: JSON.stringify({ type: "url" }) }
  );
  return data.download;
}
