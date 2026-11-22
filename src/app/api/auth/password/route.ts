import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, verifyPassword, hashPassword, isStaff } from "@/lib/auth";
import { isStrongPassword, logAdminAction } from "@/lib/security";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Veuillez renseigner l'ancien et le nouveau mot de passe." }, { status: 400 });
    }

    const strength = isStrongPassword(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: "L'ancien mot de passe est incorrect." }, { status: 401 });
    }

    const newHashed = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHashed,
        forcePasswordChange: false,
      },
    });

    if (isStaff(user.role)) {
      await logAdminAction({
        adminId: user.id,
        adminEmail: user.email,
        action: "PASSWORD_CHANGED",
        targetType: "AUTH",
        details: "Mise à jour réussie du mot de passe",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été modifié avec succès.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de modification du mot de passe" }, { status: 500 });
  }
}
