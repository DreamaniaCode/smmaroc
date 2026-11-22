import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySessionToken, isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const clients = await prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        telegram: true,
        company: true,
        tier: true,
        status: true,
        balance: true,
        currency: true,
        customDiscountPercent: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { orders: true, deposits: true },
        },
      },
    });

    const headers = [
      "ID",
      "Nom",
      "Email",
      "Téléphone / WhatsApp",
      "Telegram",
      "Entreprise",
      "Rang (Tier)",
      "Statut",
      "Solde",
      "Devise",
      "Remise (%)",
      "Commandes",
      "Dépôts",
      "Date Inscription",
      "Dernière Connexion",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = clients.map((c) => [
      escapeCsv(c.id),
      escapeCsv(c.name),
      escapeCsv(c.email),
      escapeCsv(c.phone || ""),
      escapeCsv(c.telegram || ""),
      escapeCsv(c.company || ""),
      escapeCsv(c.tier),
      escapeCsv(c.status),
      escapeCsv(Number(c.balance).toFixed(2)),
      escapeCsv(c.currency),
      escapeCsv(Number(c.customDiscountPercent).toFixed(1)),
      escapeCsv(c._count.orders),
      escapeCsv(c._count.deposits),
      escapeCsv(c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : ""),
      escapeCsv(c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleString("fr-FR") : "Jamais"),
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="smmaroc-clients-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("[CRM_EXPORT]", error);
    return NextResponse.json({ error: "Erreur lors de l'export CSV" }, { status: 500 });
  }
}
