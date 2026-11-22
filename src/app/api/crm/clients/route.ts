import { NextRequest, NextResponse } from "next/server";
import { prisma, db } from "@/lib/db";
import { verifySessionToken, isStaff } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé. Réservé à l'équipe SMMaroc." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const tier = searchParams.get("tier")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "USER"; // Default list normal users

    const where: any = {};

    if (role === "USER") {
      where.role = "USER";
    } else if (role === "ALL") {
      // allow listing any account
    }

    if (tier && tier !== "ALL") {
      where.tier = tier;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { company: { contains: query, mode: "insensitive" } },
        { telegram: { contains: query, mode: "insensitive" } },
      ];
    }

    const [users, totalClients, vipCount, resellerCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          telegram: true,
          company: true,
          tier: true,
          status: true,
          balance: true,
          currency: true,
          customDiscountPercent: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              deposits: true,
              crmNotes: true,
            },
          },
        },
      }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", tier: "VIP" } }),
      prisma.user.count({ where: { role: "USER", tier: "RESELLER" } }),
    ]);

    // Calculate aggregated metrics
    const clients = users.map((u) => ({
      ...u,
      balance: Number(u.balance),
      customDiscountPercent: Number(u.customDiscountPercent),
    }));

    const totalBalance = clients.reduce((acc, c) => acc + (c.currency === "MAD" ? c.balance : c.balance * 10), 0);

    return NextResponse.json({
      success: true,
      clients,
      stats: {
        totalClients,
        vipCount,
        resellerCount,
        totalBalance: Math.round(totalBalance * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error("[CRM_CLIENTS_GET]", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des clients CRM" }, { status: 500 });
  }
}
