import { apiRequest } from "./client";
import type { TimewebApp, TimewebAppDeploy } from "@/types/timeweb";

export async function listApps(token: string): Promise<TimewebApp[]> {
  const data = await apiRequest<{ apps: TimewebApp[] }>("/apps", token);
  return data.apps ?? [];
}

export async function getApp(token: string, id: number): Promise<TimewebApp> {
  const data = await apiRequest<{ app: TimewebApp }>(`/apps/${id}`, token);
  return data.app;
}

export async function createApp(
  token: string,
  params: {
    name: string;
    type: string;
    preset_id: number;
    provider: { type: string; branch: string; repository: string };
    framework?: string;
    envs?: Record<string, string>;
    comment?: string;
    availability_zone?: string;
  }
): Promise<TimewebApp> {
  const data = await apiRequest<{ app: TimewebApp }>("/apps", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.app;
}

export async function deleteApp(token: string, id: number): Promise<null> {
  return apiRequest(`/apps/${id}`, token, { method: "DELETE" });
}

export async function listAppDeploys(token: string, appId: number): Promise<TimewebAppDeploy[]> {
  const data = await apiRequest<{ deploys: TimewebAppDeploy[] }>(`/apps/${appId}/deploys`, token);
  return data.deploys ?? [];
}

export async function triggerAppDeploy(token: string, appId: number): Promise<TimewebAppDeploy> {
  const data = await apiRequest<{ deploy: TimewebAppDeploy }>(`/apps/${appId}/deploy`, token, {
    method: "POST",
  });
  return data.deploy;
}
