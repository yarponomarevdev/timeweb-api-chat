import { apiRequest } from "./client";
import type { TimewebBucket } from "@/types/timeweb";

export async function listBuckets(token: string): Promise<TimewebBucket[]> {
  const data = await apiRequest<{ buckets: TimewebBucket[] }>("/storages/buckets", token);
  return data.buckets;
}
