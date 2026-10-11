import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "USER") {
    const where = { userId: session.userId };
    const [totalOrders, completedOrders, inProgressOrders, failedOrders] = await Promise.all([db.order.count({ where }), db.order.count({ where: { ...where, status: "COMPLETED" } }), db.order.count({ where: { ...where, status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] } } }), db.order.count({ where: { ...where, status: "FAILED" } })]);
    return NextResponse.json({ totalOrders, completedOrders, inProgressOrders, failedOrders, providers: [] });
  }
  const [totalOrders, completedOrders, inProgressOrders, failedOrders, totalClients, providers] =
    await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "COMPLETED" } }),
      db.order.count({ where: { status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] } } }),
      db.order.count({ where: { status: "FAILED" } }),
      db.client.count(),
      db.provider.findMany({ select: { id: true, name: true, balance: true, currency: true } }),
    ]);

  const totalBalance = providers.reduce((sum, p) => sum + p.balance, 0);

  return NextResponse.json({
    totalOrders,
    completedOrders,
    inProgressOrders,
    failedOrders,
    totalClients,
    totalBalance,
    providers,
  });
}
