import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifySessionToken,
  isSuperAdmin,
  isAdmin,
  isStaff,
  hashPassword,
} from "@/lib/auth";
import { isStrongPassword, logAdminAction } from "@/lib/security";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé. Privilèges d'administration requis." }, { status: 403 });
  }

  try {
    const staffMembers = await db.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "OPERATOR"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      staff: staffMembers,
      currentUserRole: session.role,
      isSuperAdmin: isSuperAdmin(session.role),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de chargement de l'équipe" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || !isSuperAdmin(session.role)) {
    return NextResponse.json(
      { error: "Seul un Super Administrateur peut ajouter de nouveaux membres d'équipe." },
      { status: 403 }
    );
  }

  try {
    const { name, email, role, password } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const validRoles = ["SUPER_ADMIN", "ADMIN", "SUPPORT"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Rôle non valide." }, { status: 400 });
    }

    const strength = isStrongPassword(password);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      return NextResponse.json({ error: "Un compte avec cette adresse e-mail existe déjà." }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const newStaff = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hashedPassword,
        role,
        balance: 0,
        currency: "MAD",
        forcePasswordChange: true,
      },
    });

    await logAdminAction({
      adminId: session.userId,
      adminEmail: session.email,
      action: "STAFF_CREATED",
      targetType: "STAFF",
      targetId: newStaff.id,
      details: `Création du compte collaborateur ${cleanEmail} avec le rôle ${role}`,
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        status: newStaff.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de création du collaborateur" }, { status: 500 });
  }
}
