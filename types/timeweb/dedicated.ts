export interface TimewebDedicatedServer {
  id: number;
  name: string;
  comment: string;
  status: string;
  os: { id: number; name: string; version: string } | null;
  cpu: { description: string; count: number };
  ram: { size: number; count: number };
  disk: Array<{ size: number; count: number; type: string }>;
  ip: string | null;
  ipmi_ip: string | null;
  location: string;
  availability_zone: string;
  created_at: string;
  plan_id: number;
  price: number;
  network_bandwidth: number;
}

export interface TimewebDedicatedPreset {
  id: number;
  description: string;
  cpu: { description: string; count: number };
  ram: { size: number; count: number };
  disk: Array<{ size: number; count: number; type: string }>;
  price: number;
  location: string;
}
