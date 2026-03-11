import { apiRequest } from "./client";
import type {
  TimewebK8sCluster,
  TimewebK8sNodeGroup,
  TimewebK8sVersion,
  TimewebK8sNetworkDriver,
  TimewebK8sPreset,
} from "@/types/timeweb";

export async function listK8sClusters(token: string): Promise<TimewebK8sCluster[]> {
  const data = await apiRequest<{ clusters: TimewebK8sCluster[] }>("/k8s/clusters", token);
  return data.clusters ?? [];
}

export async function getK8sCluster(token: string, id: number): Promise<TimewebK8sCluster> {
  const data = await apiRequest<{ cluster: TimewebK8sCluster }>(`/k8s/clusters/${id}`, token);
  return data.cluster;
}

export async function createK8sCluster(
  token: string,
  params: {
    name: string;
    k8s_version?: string;
    network_driver?: string;
    ingress?: boolean;
    ha?: boolean;
    description?: string;
    preset_id: number;
    worker_groups: Array<{
      name: string;
      preset_id: number;
      node_count: number;
    }>;
    availability_zone?: string;
  }
): Promise<TimewebK8sCluster> {
  const data = await apiRequest<{ cluster: TimewebK8sCluster }>("/k8s/clusters", token, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.cluster;
}

export async function deleteK8sCluster(token: string, id: number): Promise<null> {
  return apiRequest(`/k8s/clusters/${id}`, token, { method: "DELETE" });
}

export async function listNodeGroups(token: string, clusterId: number): Promise<TimewebK8sNodeGroup[]> {
  const data = await apiRequest<{ node_groups: TimewebK8sNodeGroup[] }>(
    `/k8s/clusters/${clusterId}/groups`,
    token
  );
  return data.node_groups ?? [];
}

export async function createNodeGroup(
  token: string,
  clusterId: number,
  params: { name: string; preset_id: number; node_count: number }
): Promise<TimewebK8sNodeGroup> {
  const data = await apiRequest<{ node_group: TimewebK8sNodeGroup }>(
    `/k8s/clusters/${clusterId}/groups`,
    token,
    { method: "POST", body: JSON.stringify(params) }
  );
  return data.node_group;
}

export async function deleteNodeGroup(
  token: string,
  clusterId: number,
  groupId: number
): Promise<null> {
  return apiRequest(`/k8s/clusters/${clusterId}/groups/${groupId}`, token, { method: "DELETE" });
}

export async function getKubeconfig(token: string, clusterId: number): Promise<string> {
  const data = await apiRequest<{ kubeconfig: string }>(
    `/k8s/clusters/${clusterId}/kubeconfig`,
    token
  );
  return data.kubeconfig;
}

export async function listK8sVersions(token: string): Promise<TimewebK8sVersion[]> {
  const data = await apiRequest<{ k8s_versions: TimewebK8sVersion[] }>("/k8s/k8s-versions", token);
  return data.k8s_versions ?? [];
}

export async function listK8sNetworkDrivers(token: string): Promise<TimewebK8sNetworkDriver[]> {
  const data = await apiRequest<{ network_drivers: TimewebK8sNetworkDriver[] }>("/k8s/network-drivers", token);
  return data.network_drivers ?? [];
}

export async function listK8sPresets(token: string): Promise<TimewebK8sPreset[]> {
  const data = await apiRequest<{ k8s_presets: TimewebK8sPreset[] }>("/presets/k8s", token);
  return data.k8s_presets ?? [];
}
