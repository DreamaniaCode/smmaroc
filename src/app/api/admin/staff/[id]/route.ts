import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifySessionToken,
  isSuperAdmin,
  hashPassword,
} from "@/lib/auth";
import { isStrongPassword, logAdminAction } from "@/lib/security";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || !isSuperAdmin(session.role)) {
    return NextResponse.json(
      { error: "Seul un Super Administrateur peut modifier les membres de l'équipe." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const targetUser = await db.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: "Membre d'équipe introuvable." }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { role, status, newPassword, reset2FA } = body;
    const updateData: any = {};
    const changes: string[] = [];

    // Role modification
    if (role && role !== targetUser.role) {
      if (id === session.userId && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Vous ne pouvez pas rétrograder votre propre compte." }, { status: 400 });
      }
      updateData.role = role;
      changes.push(`Rôle: ${targetUser.role} -> ${role}`);
    }

    // Status modification (ACTIVE / SUSPENDED)
    if (status && status !== targetUser.status) {
      if (id === session.userId) {
        return NextResponse.json({ error: "Vous ne pouvez pas suspendre votre propre compte." }, { status: 400 });
      }
      updateData.status = status;
      changes.push(`Statut: ${status}`);
    }

    // Reset 2FA
    if (reset2FA) {
      updateData.twoFactorEnabled = false;
      updateData.twoFactorSecret = null;
      updateData.twoFactorBackupCodes = null;
      changes.push("Réinitialisation 2FA");
    }

    // Reset Password
    if (newPassword) {
      const strength = isStrongPassword(newPassword);
      if (!strength.valid) {
        return NextResponse.json({ error: strength.reason }, { status: 400 });
      }
      updateData.passwordHash = await hashPassword(newPassword);
      updateData.forcePasswordChange = true;
      changes.push("Réinitialisation du mot de passe");
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune modification fournie." }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
    });

    await logAdminAction({
      adminId: session.userId,
      adminEmail: session.email,
      action: "STAFF_UPDATED",
      targetType: "STAFF",
      targetId: id,
      details: `Modifications sur ${targetUser.email} : ${changes.join(", ")}`,
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        twoFactorEnabled: updated.twoFactorEnabled,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || !isSuperAdmin(session.role)) {
    return NextResponse.json(
      { error: "Seul un Super Administrateur peut supprimer un membre de l'équipe." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (id === session.userId) {
    return NextResponse.json({ error: "Sécurité : Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
  }

  const targetUser = await db.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: "Collaborateur introuvable." }, { status: 404 });
  }

  // Safety check: Don't delete the only Super Admin
  if (targetUser.role === "SUPER_ADMIN") {
    const superCount = await db.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superCount <= 1) {
      return NextResponse.json(
        { error: "Sécurité : Impossible de supprimer le dernier Super Administrateur du système." },
        { status: 400 }
      );
    }
  }

  try {
    // We update role to USER or delete
    await db.user.delete({ where: { id } });

    await logAdminAction({
      adminId: session.userId,
      adminEmail: session.email,
      action: "STAFF_DELETED",
      targetType: "STAFF",
      targetId: id,
      details: `Suppression définitive du compte collaborateur ${targetUser.email} (${targetUser.role})`,
    });

    return NextResponse.json({ success: true, message: "Collaborateur supprimé avec succès." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur lors de la suppression" }, { status: 500 });
  }
}
