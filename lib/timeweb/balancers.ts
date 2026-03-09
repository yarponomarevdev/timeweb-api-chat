import { apiRequest } from "./client";
import type { TimewebBalancer, TimewebBalancerRule, TimewebBalancerPreset } from "@/types/timeweb";

export async function listBalancers(token: string): Promise<TimewebBalancer[]> {
  const data = await apiRequest<{ balancers: TimewebBalancer[] }>("/balancers", token);
  return data.balancers ?? [];
}

export async function getBalancer(token: string, id: number): Promise<TimewebBalancer> {
  const data = await apiRequest<{ balancer: TimewebBalancer }>(`/balancers/${id}`, token);
  return data.balancer;
}

export async function createBalancer(
  token: string,
  params: {
    name: string;
    algo?: string;
    is_sticky?: boolean;
    is_use_proxy?: boolean;
    is_ssl?: boolean;
    is_keepalive?: boolean;
    proto: string;
    port: number;
    path?: string;
    inter?: number;
    timeout?: number;
    fall?: number;
    rise?: number;
    preset_id: number;
    availability_zone?: string;
  }
): Promise<TimewebBalancer> {
  const data = await apiRequest<{ balancer: TimewebBalancer }>("/balancers", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.balancer;
}

export async function deleteBalancer(token: string, id: number): Promise<null> {
  return apiRequest(`/balancers/${id}`, token, { method: "DELETE" });
}

export async function listBalancerRules(token: string, balancerId: number): Promise<TimewebBalancerRule[]> {
  const data = await apiRequest<{ rules: TimewebBalancerRule[] }>(
    `/balancers/${balancerId}/rules`,
    token
  );
  return data.rules ?? [];
}

export async function addBalancerRule(
  token: string,
  balancerId: number,
  params: { balancer_proto: string; balancer_port: number; server_proto: string; server_port: number }
): Promise<TimewebBalancerRule> {
  const data = await apiRequest<{ rule: TimewebBalancerRule }>(
    `/balancers/${balancerId}/rules`,
    token,
    { method: "POST", body: JSON.stringify(params) }
  );
  return data.rule;
}

export async function deleteBalancerRule(token: string, balancerId: number, ruleId: number): Promise<null> {
  return apiRequest(`/balancers/${balancerId}/rules/${ruleId}`, token, { method: "DELETE" });
}

export async function listBalancerPresets(token: string): Promise<TimewebBalancerPreset[]> {
  const data = await apiRequest<{ balancers_presets: TimewebBalancerPreset[] }>("/presets/balancers", token);
  return data.balancers_presets ?? [];
}
