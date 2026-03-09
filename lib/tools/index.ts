import { createServerTools } from "./servers";
import { createPresetTools } from "./presets";
import { createSSHKeyTools } from "./ssh-keys";
import { createBackupTools } from "./backups";
import { createFirewallTools } from "./firewalls";
import { createDomainTools } from "./domains";
import { createDatabaseTools } from "./databases";
import { createBucketTools } from "./buckets";
import { createKubernetesTools } from "./kubernetes";
import { createBalancerTools } from "./balancers";
import { createFloatingIPTools } from "./floating-ips";
import { createVPCTools } from "./vpc";
import { createProjectTools } from "./projects";
import { createAppTools } from "./apps";
import { createDedicatedTools } from "./dedicated";
import { createNetworkDriveTools } from "./network-drives";
import { createImageTools } from "./images";
import { createRegistryTools } from "./registry";
import { createMailTools } from "./mail";
import { createMiscTools } from "./misc";
import { createVirtualRouterTools } from "./virtual-routers";

// Re-export типов для message.tsx
export type {
  ServerSummary,
  ServerSummaryWithNetworks,
  CreateServerOutput,
  DeleteServerOutput,
  ServerActionOutput,
  ResizeServerOutput,
  ServerStatsOutput,
} from "./servers";

export type {
  OsOption,
  PresetSummary,
  LocationOption,
  ProposeServerOutput,
  BalanceOutput,
} from "./presets";

export type {
  SSHKeySummary,
  CreateSSHKeyOutput,
  DeleteSSHKeyOutput,
} from "./ssh-keys";

export type {
  BackupSummary,
  CreateBackupOutput,
  RestoreBackupOutput,
} from "./backups";

export type {
  FirewallGroupSummary,
  CreateFirewallOutput,
  FirewallRuleSummary,
  AddFirewallRuleOutput,
  AttachFirewallOutput,
} from "./firewalls";

export function createTools(token: string) {
  return {
    ...createServerTools(token),
    ...createPresetTools(token),
    ...createSSHKeyTools(token),
    ...createBackupTools(token),
    ...createFirewallTools(token),
    ...createDomainTools(token),
    ...createDatabaseTools(token),
    ...createBucketTools(token),
    ...createKubernetesTools(token),
    ...createBalancerTools(token),
    ...createFloatingIPTools(token),
    ...createVPCTools(token),
    ...createProjectTools(token),
    ...createAppTools(token),
    ...createDedicatedTools(token),
    ...createNetworkDriveTools(token),
    ...createImageTools(token),
    ...createRegistryTools(token),
    ...createMailTools(token),
    ...createMiscTools(token),
    ...createVirtualRouterTools(token),
  };
}
