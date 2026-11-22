import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, createSessionToken, isStaff } from "@/lib/auth";
import { verifyTotpToken, logAdminAction } from "@/lib/security";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    const { tempToken, code } = await req.json();
    const ip = getClientIp(req);

    if (!tempToken || !code) {
      return NextResponse.json({ error: "Le jeton temporaire et le code 2FA sont obligatoires." }, { status: 400 });
    }

    const payload = await verifySessionToken(tempToken);
    if (!payload || !payload.is2faPending) {
      return NextResponse.json({ error: "Session 2FA expirée. Veuillez recommencer la connexion." }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: "Configuration 2FA invalide." }, { status: 400 });
    }

    const cleanCode = code.trim();
    let isTotpValid = verifyTotpToken(user.twoFactorSecret, cleanCode);
    let usedBackupCode = false;

    // Check backup codes if TOTP failed
    if (!isTotpValid && user.twoFactorBackupCodes) {
      const backupCodesList = user.twoFactorBackupCodes.split(",").map((c: string) => c.trim().toUpperCase());
      const normalizedEnteredCode = cleanCode.toUpperCase();
      if (backupCodesList.includes(normalizedEnteredCode)) {
        isTotpValid = true;
        usedBackupCode = true;
        // Consume backup code
        const remainingCodes = backupCodesList.filter((c: string) => c !== normalizedEnteredCode);
        await db.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: remainingCodes.join(",") },
        });
      }
    }

    if (!isTotpValid) {
      if (isStaff(user.role)) {
        await logAdminAction({
          adminId: user.id,
          adminEmail: user.email,
          action: "FAILED_2FA",
          targetType: "AUTH",
          details: `Code 2FA incorrect soumis`,
          ipAddress: ip,
        });
      }
      return NextResponse.json({ error: "Code d'authentification invalide ou expiré." }, { status: 401 });
    }

    // Generate Final Session
    const finalToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        failedLoginAttempts: 0,
      },
    });

    if (isStaff(user.role)) {
      await logAdminAction({
        adminId: user.id,
        adminEmail: user.email,
        action: "LOGIN_2FA_SUCCESS",
        targetType: "AUTH",
        details: usedBackupCode ? "Connexion réussie via code de secours" : "Connexion réussie avec TOTP",
        ipAddress: ip,
      });
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier || "STANDARD",
        forcePasswordChange: Boolean(user.forcePasswordChange),
      },
    });

    res.cookies.set("smm_session", finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur de validation 2FA" }, { status: 500 });
  }
}
