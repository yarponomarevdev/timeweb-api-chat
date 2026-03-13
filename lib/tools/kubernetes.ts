import { tool } from "ai";
import { z } from "zod";
import * as tw from "@/lib/timeweb";
import type { TimewebK8sNodeGroup } from "@/types/timeweb/kubernetes";

export function createKubernetesTools(token: string) {
  return {
    k8s_clusters: tool({
      description:
        "Управление Kubernetes кластерами: list (список), get (детали), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "get", "create", "delete"]).describe("Действие"),
        cluster_id: z.number().optional().describe("ID кластера (для get, delete)"),
        name: z.string().optional().describe("Имя кластера (для create)"),
        preset_id: z.number().optional().describe("ID тарифа мастер-ноды (для create)"),
        k8s_version: z.string().optional().describe("Версия Kubernetes (для create)"),
        network_driver: z.string().optional().describe("Сетевой драйвер, например canal, cilium (для create)"),
        worker_groups: z
          .array(
            z.object({
              name: z.string().describe("Имя группы воркеров"),
              preset_id: z.number().describe("ID тарифа воркер-ноды"),
              node_count: z.number().describe("Количество нод"),
            })
          )
          .optional()
          .describe("Группы воркер-нод (для create)"),
        availability_zone: z.string().optional().describe("Зона размещения (для create)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const clusters = await tw.listK8sClusters(token);
            return clusters.map((c) => ({
              id: c.id,
              name: c.name,
              status: c.status,
              k8s_version: c.k8s_version,
              ha: c.ha,
              region: c.region,
              node_groups_count: c.node_groups?.length ?? 0,
            }));
          }
          case "get": {
            const c = await tw.getK8sCluster(token, input.cluster_id!);
            return {
              id: c.id,
              name: c.name,
              status: c.status,
              description: c.description,
              ha: c.ha,
              k8s_version: c.k8s_version,
              network_driver: c.network_driver,
              ingress: c.ingress,
              preset_id: c.preset_id,
              cpu: c.cpu,
              ram: c.ram,
              disk: c.disk,
              region: c.region,
              availability_zone: c.availability_zone,
              created_at: c.created_at,
              node_groups: c.node_groups?.map((g: TimewebK8sNodeGroup) => ({
                id: g.id,
                name: g.name,
                node_count: g.node_count,
                cpu: g.cpu,
                ram: g.ram,
                disk: g.disk,
                status: g.status,
              })) ?? [],
            };
          }
          case "create": {
            const c = await tw.createK8sCluster(token, {
              name: input.name!,
              preset_id: input.preset_id!,
              k8s_version: input.k8s_version,
              network_driver: input.network_driver,
              worker_groups: input.worker_groups!,
              availability_zone: input.availability_zone,
            });
            return {
              id: c.id,
              name: c.name,
              status: c.status,
              k8s_version: c.k8s_version,
              network_driver: c.network_driver,
              region: c.region,
              message: "Кластер Kubernetes создаётся, обычно занимает несколько минут. Для получения kubeconfig используйте k8s_kubeconfig после готовности кластера.",
            };
          }
          case "delete": {
            await tw.deleteK8sCluster(token, input.cluster_id!);
            return {
              success: true,
              message: `Кластер ${input.cluster_id} удалён`,
            };
          }
        }
      },
    }),

    k8s_node_groups: tool({
      description:
        "Управление группами нод Kubernetes: list (список), create (создать), delete (удалить)",
      inputSchema: z.object({
        action: z.enum(["list", "create", "delete"]).describe("Действие"),
        cluster_id: z.number().optional().describe("ID кластера (для list, create, delete)"),
        name: z.string().optional().describe("Имя группы нод (для create)"),
        preset_id: z.number().optional().describe("ID тарифа ноды (для create)"),
        node_count: z.number().optional().describe("Количество нод (для create)"),
        group_id: z.number().optional().describe("ID группы нод (для delete)"),
      }),
      execute: async (input) => {
        switch (input.action) {
          case "list": {
            const groups = await tw.listNodeGroups(token, input.cluster_id!);
            return groups.map((g) => ({
              id: g.id,
              name: g.name,
              preset_id: g.preset_id,
              node_count: g.node_count,
              cpu: g.cpu,
              ram: g.ram,
              disk: g.disk,
              status: g.status,
              created_at: g.created_at,
            }));
          }
          case "create": {
            const g = await tw.createNodeGroup(token, input.cluster_id!, {
              name: input.name!,
              preset_id: input.preset_id!,
              node_count: input.node_count!,
            });
            return {
              id: g.id,
              name: g.name,
              node_count: g.node_count,
              status: g.status,
              message: "Группа нод создаётся",
            };
          }
          case "delete": {
            await tw.deleteNodeGroup(token, input.cluster_id!, input.group_id!);
            return {
              success: true,
              message: `Группа нод ${input.group_id} удалена`,
            };
          }
        }
      },
    }),

    k8s_kubeconfig: tool({
      description: "Получить kubeconfig для подключения к Kubernetes кластеру",
      inputSchema: z.object({
        cluster_id: z.number().describe("ID кластера"),
      }),
      execute: async ({ cluster_id }) => {
        const kubeconfig = await tw.getKubeconfig(token, cluster_id);
        return { cluster_id, kubeconfig };
      },
    }),

    k8s_versions: tool({
      description:
        "Получить доступные версии Kubernetes и сетевые драйверы",
      inputSchema: z.object({}),
      execute: async () => {
        const [versionsResult, driversResult, presetsResult] = await Promise.allSettled([
          tw.listK8sVersions(token),
          tw.listK8sNetworkDrivers(token),
          tw.listK8sPresets(token),
        ]);

        const errors: string[] = [];
        if (versionsResult.status === "rejected") errors.push("версии K8s недоступны");
        if (driversResult.status === "rejected") errors.push("сетевые драйверы недоступны");
        if (presetsResult.status === "rejected") errors.push("тарифы K8s недоступны");

        return {
          versions: versionsResult.status === "fulfilled"
            ? versionsResult.value.map((v) => ({ version: v.version, is_default: v.is_default }))
            : [],
          network_drivers: driversResult.status === "fulfilled"
            ? driversResult.value.map((d) => ({ driver: d.driver, description: d.description }))
            : [],
          presets: presetsResult.status === "fulfilled"
            ? presetsResult.value.map((p) => ({
                id: p.id,
                description: p.description,
                cpu: p.cpu,
                ram_gb: Math.round(p.ram / 1024),
                disk_gb: p.disk,
                price_per_month: p.price,
              }))
            : [],
          ...(errors.length > 0 ? { warning: `Часть данных недоступна: ${errors.join(", ")}` } : {}),
        };
      },
    }),
  };
}
