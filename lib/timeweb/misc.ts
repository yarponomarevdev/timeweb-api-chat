import { apiRequest } from "./client";
import type {
  TimewebLocation,
  TimewebAPIKey,
  TimewebAccountStatus,
  TimewebNotificationSetting,
} from "@/types/timeweb";

// ─── Локации ────────────────────────────────────────────────────────────────

export async function listLocations(token: string): Promise<TimewebLocation[]> {
  const data = await apiRequest<{ locations: TimewebLocation[] }>("/locations", token, {}, "v2");
  return data.locations ?? [];
}

// ─── API-ключи ──────────────────────────────────────────────────────────────

export async function listAPIKeys(token: string): Promise<TimewebAPIKey[]> {
  const data = await apiRequest<{ api_keys: TimewebAPIKey[] }>("/auth/api-keys", token);
  return data.api_keys ?? [];
}

export async function createAPIKey(
  token: string,
  params: { name: string; expires_at?: string }
): Promise<TimewebAPIKey> {
  const data = await apiRequest<{ api_key: TimewebAPIKey }>("/auth/api-keys", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.api_key;
}

export async function deleteAPIKey(token: string, id: string): Promise<null> {
  return apiRequest(`/auth/api-keys/${id}`, token, { method: "DELETE" });
}

// ─── Аккаунт ────────────────────────────────────────────────────────────────

export async function getAccountStatus(token: string): Promise<TimewebAccountStatus> {
  const data = await apiRequest<{ status: TimewebAccountStatus }>("/account/status", token);
  return data.status;
}

export async function listNotificationSettings(token: string): Promise<TimewebNotificationSetting[]> {
  const data = await apiRequest<{ notification_settings: TimewebNotificationSetting[] }>(
    "/account/notification-settings",
    token
  );
  return data.notification_settings ?? [];
}
