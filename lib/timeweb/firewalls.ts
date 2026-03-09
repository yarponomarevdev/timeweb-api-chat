import { apiRequest } from "./client";
import type { TimewebFirewallGroup, TimewebFirewallRule } from "@/types/timeweb";

export async function listFirewalls(token: string): Promise<TimewebFirewallGroup[]> {
  const data = await apiRequest<{ firewall_groups: TimewebFirewallGroup[] }>(
    "/firewall/groups",
    token
  );
  return data.firewall_groups ?? [];
}

export async function createFirewall(
  token: string,
  params: { name: string; description?: string }
): Promise<TimewebFirewallGroup> {
  const data = await apiRequest<{ firewall_group: TimewebFirewallGroup }>("/firewall/groups", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.firewall_group;
}

export async function deleteFirewall(token: string, id: string): Promise<null> {
  return apiRequest(`/firewall/groups/${id}`, token, { method: "DELETE" });
}

export async function listFirewallRules(
  token: string,
  firewallId: string
): Promise<TimewebFirewallRule[]> {
  const data = await apiRequest<{ firewall_rules: TimewebFirewallRule[] }>(
    `/firewall/groups/${firewallId}/rules`,
    token
  );
  return data.firewall_rules ?? [];
}

export async function addFirewallRule(
  token: string,
  firewallId: string,
  params: {
    direction: "ingress" | "egress";
    protocol: "tcp" | "udp" | "icmp" | "all";
    port?: string;
    cidr: string;
    description?: string;
  }
): Promise<TimewebFirewallRule> {
  const data = await apiRequest<{ firewall_rule: TimewebFirewallRule }>(
    `/firewall/groups/${firewallId}/rules`,
    token,
    { method: "POST", body: JSON.stringify(params) }
  );
  return data.firewall_rule;
}

export async function deleteFirewallRule(
  token: string,
  firewallId: string,
  ruleId: string
): Promise<null> {
  return apiRequest(`/firewall/groups/${firewallId}/rules/${ruleId}`, token, { method: "DELETE" });
}

export async function attachFirewallToServer(
  token: string,
  firewallId: string,
  serverId: number
): Promise<null> {
  return apiRequest(`/firewall/groups/${firewallId}/resources/servers`, token, {
    method: "POST",
    body: JSON.stringify({ resource_id: String(serverId) }),
  });
}
