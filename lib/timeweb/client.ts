import {
  Configuration,
  ServersApi,
  DatabasesApi,
  DomainsApi,
  BalancersApi,
  KubernetesApi,
  S3Api,
  SSHApi,
  FirewallApi,
  FloatingIPApi,
  VPCApi,
  AccountApi,
  ProjectsApi,
  ImagesApi,
  NetworkDrivesApi,
  AppsApi,
  DedicatedServersApi,
  MailApi,
  ContainerRegistryApi,
  AIAgentsApi,
  APIKeysApi,
  LocationsApi,
  PaymentsApi,
  KnowledgeBasesApi,
} from "timeweb_cloud_api";

// ─── SDK ────────────────────────────────────────────────────────────────────

/**
 * Создаёт конфигурацию для официального Timeweb Cloud SDK.
 */
export function createSdkConfig(token: string): Configuration {
  return new Configuration({
    accessToken: token,
    basePath: "https://api.timeweb.cloud",
  });
}

/**
 * Возвращает все SDK API-клиенты для данного токена.
 * Используй это для новых модулей вместо ручного apiRequest.
 *
 * @example
 * const { servers } = getSdkApis(token);
 * const resp = await servers.getServers({});
 */
export function getSdkApis(token: string) {
  const config = createSdkConfig(token);
  return {
    servers: new ServersApi(config),
    databases: new DatabasesApi(config),
    domains: new DomainsApi(config),
    balancers: new BalancersApi(config),
    kubernetes: new KubernetesApi(config),
    s3: new S3Api(config),
    ssh: new SSHApi(config),
    firewall: new FirewallApi(config),
    floatingIp: new FloatingIPApi(config),
    vpc: new VPCApi(config),
    account: new AccountApi(config),
    projects: new ProjectsApi(config),
    images: new ImagesApi(config),
    networkDrives: new NetworkDrivesApi(config),
    apps: new AppsApi(config),
    dedicated: new DedicatedServersApi(config),
    mail: new MailApi(config),
    registry: new ContainerRegistryApi(config),
    aiAgents: new AIAgentsApi(config),
    apiKeys: new APIKeysApi(config),
    locations: new LocationsApi(config),
    payments: new PaymentsApi(config),
    knowledgeBases: new KnowledgeBasesApi(config),
  };
}

// ─── Legacy fetch-based client (обратная совместимость) ─────────────────────

const BASE_V1 = "https://api.timeweb.cloud/api/v1";
const BASE_V2 = "https://api.timeweb.cloud/api/v2";

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 600;

export function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {},
  version: "v1" | "v2" = "v1"
): Promise<T> {
  const base = version === "v2" ? BASE_V2 : BASE_V1;
  const maxAttempts = RETRY_ATTEMPTS;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }

    const res = await fetch(`${base}${path}`, {
      ...options,
      headers: { ...getHeaders(token), ...options.headers },
    });

    if (!res.ok) {
      if (RETRYABLE_STATUSES.has(res.status) && attempt < maxAttempts - 1) {
        lastError = new Error(`Timeweb API error ${res.status}: ${res.statusText}`);
        continue;
      }
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(
        `Timeweb API error ${res.status}: ${error.message || JSON.stringify(error)}`
      );
    }

    if (res.status === 204) return null as T;
    return res.json();
  }

  throw lastError;
}
