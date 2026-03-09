export interface TimewebFirewallGroup {
  id: string;
  name: string;
  description: string;
  status: string;
  rules_count: number;
  resources_count: number;
  created_at: string;
}

export interface TimewebFirewallRule {
  id: string;
  direction: "ingress" | "egress";
  protocol: "tcp" | "udp" | "icmp" | "all";
  port: string | null;
  cidr: string;
  description: string;
}
