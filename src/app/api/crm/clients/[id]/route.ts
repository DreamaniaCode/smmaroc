import { NextRequest, NextResponse } from "next/server";
import { prisma, db } from "@/lib/db";
import { verifySessionToken, isStaff, isAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/security";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        crmNotes: {
          orderBy: { createdAt: "desc" },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            service: { select: { name: true, category: true } },
          },
        },
        deposits: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            orders: true,
            deposits: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Compute total spend on orders
    const spendAgg = await prisma.order.aggregate({
      where: { userId: id, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _sum: { charge: true },
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      telegram: user.telegram,
      company: user.company,
      tier: user.tier,
      status: user.status,
      balance: Number(user.balance),
      currency: user.currency,
      customDiscountPercent: Number(user.customDiscountPercent),
      adminNotes: user.adminNotes,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      createdAt: user.createdAt,
      totalOrders: user._count.orders,
      totalDeposits: user._count.deposits,
      totalSpent: Number(spendAgg._sum.charge ?? 0),
      orders: user.orders.map((o) => ({
        id: o.id,
        serviceName: o.service?.name ?? "Service inconnu",
        category: o.service?.category ?? "Général",
        link: o.link,
        quantity: o.quantity,
        charge: Number(o.charge),
        status: o.status,
        createdAt: o.createdAt,
      })),
      deposits: user.deposits.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        currency: d.currency,
        status: d.status,
        method: d.method,
        createdAt: d.createdAt,
      })),
      crmNotes: user.crmNotes,
    };

    return NextResponse.json({ success: true, client: safeUser });
  } catch (error: any) {
    console.error("[CRM_CLIENT_DETAIL]", error);
    return NextResponse.json({ error: "Erreur lors du chargement du profil client" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { phone, telegram, company, tier, status, customDiscountPercent, adminNotes } = body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (telegram !== undefined) updateData.telegram = telegram ? String(telegram).trim() : null;
    if (company !== undefined) updateData.company = company ? String(company).trim() : null;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes ? String(adminNotes).trim() : null;

    if (tier && ["STANDARD", "VIP", "RESELLER", "AGENCY"].includes(tier)) {
      updateData.tier = tier;
    }

    if (status && ["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
      // Disallow non-admins from banning
      if (status === "BANNED" && !isAdmin(session.role)) {
        return NextResponse.json({ error: "Seul un administrateur peut bannir un compte." }, { status: 403 });
      }
      updateData.status = status;
    }

    if (customDiscountPercent !== undefined) {
      const discount = Number(customDiscountPercent);
      if (discount >= 0 && discount <= 100) {
        updateData.customDiscountPercent = discount;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logAdminAction({
      adminId: session.userId,
      adminEmail: session.email,
      action: "CRM_CLIENT_UPDATED",
      target: `User ID: ${id} (${updated.email})`,
      ipAddress: ip,
      details: JSON.stringify({ changes: updateData }),
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    console.error("[CRM_CLIENT_PATCH]", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du client" }, { status: 500 });
  }
}
