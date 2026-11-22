import { NextRequest, NextResponse } from "next/server";
import { prisma, db } from "@/lib/db";
import { verifySessionToken, isAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/security";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { type, amount, reason } = await req.json();

    const numericAmount = Math.abs(Number(amount));
    if (!numericAmount || numericAmount <= 0 || !Number.isFinite(numericAmount)) {
      return NextResponse.json({ error: "Montant invalide. Veuillez renseigner un chiffre strictement supérieur à 0." }, { status: 400 });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json({ error: "Le motif d'ajustement est obligatoire (au moins 5 caractères)." }, { status: 400 });
    }

    if (!["CREDIT", "DEBIT"].includes(type)) {
      return NextResponse.json({ error: "Type d'opération invalide (doit être CREDIT ou DEBIT)." }, { status: 400 });
    }

    const client = await prisma.user.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
    }

    const currentBalance = Number(client.balance);
    let newBalance = currentBalance;

    if (type === "CREDIT") {
      newBalance = currentBalance + numericAmount;
      await db.creditWallet(id, numericAmount);
    } else {
      if (currentBalance < numericAmount) {
        return NextResponse.json({
          error: `Solde insuffisant pour ce débit. Solde actuel: ${currentBalance.toFixed(2)} ${client.currency}, Débit demandé: ${numericAmount.toFixed(2)} ${client.currency}`,
        }, { status: 400 });
      }
      const debited = await db.debitWallet(id, numericAmount);
      if (!debited) {
        return NextResponse.json({ error: "Échec du débit du portefeuille." }, { status: 400 });
      }
      newBalance = currentBalance - numericAmount;
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const sign = type === "CREDIT" ? "+" : "-";

    // 1. Audit Log
    await logAdminAction({
      adminId: session.userId,
      adminEmail: session.email,
      action: "USER_BALANCE_ADJUSTED",
      target: `User ID: ${id} (${client.email})`,
      ipAddress: ip,
      details: JSON.stringify({
        operation: type,
        amount: numericAmount,
        oldBalance: currentBalance,
        newBalance,
        currency: client.currency,
        reason: reason.trim(),
      }),
    });

    // 2. Add automatic note on client's CRM timeline
    await db.crmNote.create({
      data: {
        userId: id,
        authorId: session.userId,
        authorName: session.name || session.email,
        content: `[AJUSTEMENT FINANCIER PAR L'ADMIN] ${sign}${numericAmount.toFixed(2)} ${client.currency} (Nouveau solde: ${newBalance.toFixed(2)} ${client.currency}). Motif: ${reason.trim()}`,
      },
    });

    return NextResponse.json({
      success: true,
      newBalance,
      currency: client.currency,
      message: `Portefeuille ${type === "CREDIT" ? "crédité" : "débité"} avec succès de ${numericAmount.toFixed(2)} ${client.currency}.`,
    });
  } catch (error: any) {
    console.error("[CRM_ADJUST_BALANCE]", error);
    return NextResponse.json({ error: "Erreur lors de l'ajustement du solde" }, { status: 500 });
  }
}
