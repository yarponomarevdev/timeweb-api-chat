import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, "docs/timeweb-api/source-of-truth.json");
const toolsDir = path.join(ROOT, "lib/tools");
const timewebDir = path.join(ROOT, "lib/timeweb");
const reportPath = path.join(ROOT, "docs/timeweb-api/coverage-report.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readFiles(dirPath) {
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => ({
      name: f,
      content: fs.readFileSync(path.join(dirPath, f), "utf8"),
    }));
}

function collectToolNames(files) {
  const names = new Set();
  const pattern = /^\s*([a-zA-Z0-9_]+):\s*tool\(/gm;
  for (const file of files) {
    let match;
    while ((match = pattern.exec(file.content)) !== null) {
      names.add(match[1]);
    }
  }
  return Array.from(names).sort();
}

function collectClientFunctions(files) {
  const names = new Set();
  const pattern = /export async function\s+([a-zA-Z0-9_]+)\s*\(/g;
  for (const file of files) {
    let match;
    while ((match = pattern.exec(file.content)) !== null) {
      names.add(match[1]);
    }
  }
  return Array.from(names).sort();
}

const manifest = readJson(manifestPath);
const toolFiles = readFiles(toolsDir);
const clientFiles = readFiles(timewebDir).filter(
  (f) => !["client.ts", "helpers.ts", "index.ts"].includes(f.name)
);

const tools = collectToolNames(toolFiles);
const clientFunctions = collectClientFunctions(clientFiles);

const expectedDomainTools = {
  servers: ["list_servers", "get_server", "create_server", "delete_server", "server_action"],
  presets_os_balance: ["list_presets", "list_os", "get_balance", "propose_server"],
  ssh_keys: ["list_ssh_keys", "create_ssh_key", "delete_ssh_key"],
  firewall: ["list_firewalls", "create_firewall", "delete_firewall", "add_firewall_rule"],
  domains: ["list_domains", "domains"],
  databases: ["list_databases", "create_database", "databases"],
  s3_buckets: ["list_buckets", "buckets"],
  kubernetes: ["k8s_clusters", "k8s_node_groups", "k8s_kubeconfig", "k8s_versions"],
  balancers: ["load_balancers", "load_balancer_rules"],
  floating_ips: ["floating_ips"],
  vpc: ["vpcs"],
  projects: ["projects", "project_resources"],
  apps: ["apps", "app_deploys"],
  dedicated_servers: ["dedicated_servers"],
  network_drives: ["network_drives"],
  images: ["images"],
  container_registry: ["container_registry"],
  mail: ["mail_domains", "mailboxes"],
  misc: ["list_locations", "api_keys", "account_info", "timeweb_api_universal"],
  virtual_routers: ["virtual_routers"]
};

const missingByDomain = {};
for (const domain of manifest.domains) {
  const expected = expectedDomainTools[domain.name] ?? [];
  const missing = expected.filter((toolName) => !tools.includes(toolName));
  if (missing.length > 0) {
    missingByDomain[domain.name] = missing;
  }
}

const report = {
  checkedAt: new Date().toISOString(),
  totals: {
    publicApiMethodsClaimedByProvider: manifest.knownTotals.publicApiMethodsClaimedByProvider,
    clientFunctions: clientFunctions.length,
    tools: tools.length,
    coveredDomains: manifest.domains.length,
    missingDomains: Object.keys(missingByDomain).length
  },
  toolNames: tools,
  clientFunctions,
  missingByDomain,
  hasUniversalFallback: tools.includes("timeweb_api_universal")
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

if (Object.keys(missingByDomain).length > 0) {
  console.error("Timeweb coverage check failed. Missing tools:");
  console.error(JSON.stringify(missingByDomain, null, 2));
  process.exit(1);
}

console.log("Timeweb coverage check passed.");
console.log(`Report written to ${path.relative(ROOT, reportPath)}`);
