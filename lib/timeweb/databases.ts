import { apiRequest } from "./client";
import type { TimewebDatabase } from "@/types/timeweb";

export async function listDatabases(token: string): Promise<TimewebDatabase[]> {
  const data = await apiRequest<{ dbs: TimewebDatabase[] }>("/dbs", token);
  return data.dbs;
}

export async function createDatabase(
  token: string,
  params: { name: string; type: string; preset_id: number; password: string }
): Promise<TimewebDatabase> {
  const data = await apiRequest<{ db: TimewebDatabase }>("/dbs", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.db;
}
