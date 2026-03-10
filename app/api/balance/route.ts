import * as tw from "@/lib/timeweb";

export async function GET(req: Request) {
  const token = req.headers.get("x-timeweb-token");
  if (!token) return new Response("Missing token", { status: 401 });

  try {
    const finances = await tw.getBalance(token);
    if (!finances) return new Response("No finances data", { status: 502 });
    const hoursLeft = finances.hours_left ?? null;
    const daysLeft = hoursLeft != null ? Math.floor(hoursLeft / 24) : null;
    return Response.json({
      balance: finances.balance,
      currency: finances.currency ?? "RUB",
      total: finances.total,
      promocode_balance: finances.promocode_balance,
      hours_left: hoursLeft,
      days_left: daysLeft,
      is_blocked: finances.is_blocked,
      penalty: finances.penalty,
    });
  } catch (err) {
    console.error("[api/balance]", err);
    return new Response("Error", { status: 500 });
  }
}
