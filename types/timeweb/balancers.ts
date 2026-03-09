export interface TimewebBalancer {
  id: number;
  name: string;
  algo: string;
  status: string;
  port: number;
  proto: string;
  path: string;
  inter: number;
  timeout: number;
  fall: number;
  rise: number;
  preset_id: number;
  is_ssl: boolean;
  is_sticky: boolean;
  is_use_proxy: boolean;
  is_keepalive: boolean;
  local_ip: string | null;
  ip: string | null;
  created_at: string;
  location: string;
  availability_zone: string;
  ips: string[];
  rules: TimewebBalancerRule[];
}

export interface TimewebBalancerRule {
  id: number;
  balancer_proto: string;
  balancer_port: number;
  server_proto: string;
  server_port: number;
}

export interface TimewebBalancerPreset {
  id: number;
  description: string;
  description_short: string;
  bandwidth: number;
  replica_count: number;
  request_per_second: number;
  price: number;
  location: string;
}
