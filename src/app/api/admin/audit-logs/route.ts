import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, isStaff } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "40", 10)));

  const where: any = {};
  if (action && action !== "ALL") {
    where.action = action;
  }

  try {
    const logs = await db.adminAuditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await db.adminAuditLog.count({ where });

    return NextResponse.json({ logs, total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de chargement des logs" }, { status: 500 });
  }
}
