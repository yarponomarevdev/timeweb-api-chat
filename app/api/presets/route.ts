import * as tw from "@/lib/timeweb";

export async function GET(req: Request) {
  const token = req.headers.get("x-timeweb-token");
  if (!token) return new Response("Missing token", { status: 401 });

  try {
    const presets = await tw.listPresets(token);
    const result = presets.map((p) => ({
      id: p.id,
      description: p.description_short || p.description,
      cpu: p.cpu,
      ram_gb: Math.round(p.ram / 1024),
      disk_gb: Math.round(p.disk / 1024),
      price_per_month: p.price,
    }));
    return Response.json({ presets: result });
  } catch (err) {
    console.error("[api/presets]", err);
    return new Response("Error", { status: 500 });
  }
}
