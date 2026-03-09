export interface TimewebK8sCluster {
  id: number;
  name: string;
  status: string;
  description: string;
  ha: boolean;
  k8s_version: string;
  network_driver: string;
  ingress: boolean;
  preset_id: number;
  cpu: number;
  ram: number;
  disk: number;
  created_at: string;
  region: string;
  availability_zone: string;
  node_groups: TimewebK8sNodeGroup[];
}

export interface TimewebK8sNodeGroup {
  id: number;
  name: string;
  preset_id: number;
  node_count: number;
  cpu: number;
  ram: number;
  disk: number;
  status: string;
  created_at: string;
}

export interface TimewebK8sVersion {
  version: string;
  is_default: boolean;
}

export interface TimewebK8sNetworkDriver {
  driver: string;
  description: string;
}

export interface TimewebK8sPreset {
  id: number;
  description: string;
  description_short: string;
  cpu: number;
  ram: number;
  disk: number;
  price: number;
  type: string;
}
