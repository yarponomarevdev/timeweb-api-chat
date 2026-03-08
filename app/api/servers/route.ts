import * as tw from "@/lib/timeweb";

export async function GET(req: Request) {
  const token = req.headers.get("x-timeweb-token");
  if (!token) return new Response("Missing token", { status: 401 });

  try {
    const servers = await tw.listServers(token);
    const result = servers.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      status_label: tw.getStatusLabel(s.status),
      os: s.os?.name ?? "—",
      os_version: s.os?.version,
      cpu: s.cpu,
      ram_mb: s.ram,
      disk_gb: tw.getServerDiskGB(s),
      location: s.location,
      created_at: s.created_at,
    }));
    return Response.json({ servers: result });
  } catch (err) {
    console.error("[api/servers]", err);
    return new Response("Error", { status: 500 });
  }
}
