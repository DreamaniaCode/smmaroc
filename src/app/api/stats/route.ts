import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
 try {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "USER") {
    const where = { userId: session.userId };
    const [totalOrders, completedOrders, inProgressOrders, failedOrders] = await Promise.all([db.order.count({ where }), db.order.count({ where: { ...where, status: "COMPLETED" } }), db.order.count({ where: { ...where, status: { in: ["PENDING", "AWAITING_FUNDS", "DISPATCHING", "PROCESSING", "IN_PROGRESS"] } } }), db.order.count({ where: { ...where, status: { in: ["FAILED", "REVIEW_REQUIRED"] } } })]);
    return NextResponse.json({ totalOrders, completedOrders, inProgressOrders, failedOrders, providers: [] });
  }
  const [totalOrders, completedOrders, inProgressOrders, failedOrders, totalClients, providers, recentClients] =
    await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "COMPLETED" } }),
      db.order.count({ where: { status: { in: ["PENDING", "AWAITING_FUNDS", "DISPATCHING", "PROCESSING", "IN_PROGRESS"] } } }),
      db.order.count({ where: { status: { in: ["FAILED", "REVIEW_REQUIRED"] } } }),
      db.user.count({where:{role:"USER"}}),
      db.provider.findMany({ select: { id: true, name: true, balance: true, currency: true, lowBalanceLimit: true, isActive: true } }),
      db.user.findMany({where:{role:"USER"},take:5,orderBy:{createdAt:"desc"},select:{id:true,name:true,email:true,createdAt:true,balance:true,currency:true}}),
    ]);

  const totalBalance = providers.reduce((sum, p) => sum + p.balance, 0);

  return NextResponse.json({
    totalOrders,
    completedOrders,
    inProgressOrders,
    failedOrders,
    totalClients,
    recentClients,
    totalBalance,
    providers,
  });
 } catch (error: any) { console.error("[stats]", error.code || error.name); return NextResponse.json({error:"Impossible de charger le tableau de bord. Veuillez réessayer."},{status:503}); }
}
