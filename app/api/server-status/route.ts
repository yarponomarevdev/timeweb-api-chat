import * as tw from "@/lib/timeweb";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = req.headers.get("x-timeweb-token");

  if (!id || !token) {
    return Response.json({ error: "Missing id or token" }, { status: 400 });
  }

  try {
    const server = await tw.getServer(token, Number(id));
    return Response.json({
      id: server.id,
      status: server.status,
      status_label: tw.getStatusLabel(server.status),
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
