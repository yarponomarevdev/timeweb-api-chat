import { apiRequest } from "./client";
import type { TimewebBucket } from "@/types/timeweb";

export async function listBuckets(token: string): Promise<TimewebBucket[]> {
  const data = await apiRequest<{ buckets: TimewebBucket[] }>("/storages/buckets", token);
  return data.buckets ?? [];
}

export async function getBucket(token: string, id: number): Promise<TimewebBucket> {
  const data = await apiRequest<{ bucket: TimewebBucket }>(`/storages/buckets/${id}`, token);
  return data.bucket;
}

export async function createBucket(
  token: string,
  params: { name: string; type?: "private" | "public"; location?: string }
): Promise<TimewebBucket> {
  const data = await apiRequest<{ bucket: TimewebBucket }>("/storages/buckets", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.bucket;
}

export async function deleteBucket(token: string, id: number): Promise<null> {
  return apiRequest(`/storages/buckets/${id}`, token, { method: "DELETE" });
}
