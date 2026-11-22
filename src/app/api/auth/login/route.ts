import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword,
  createSessionToken,
  create2FaPendingToken,
  ensureInitialAdmin,
  isStaff,
} from "@/lib/auth";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
  logAdminAction,
} from "@/lib/security";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    await ensureInitialAdmin();

    const body = await req.json();
    const { email, password } = body;
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    if (!email || !password) {
      return NextResponse.json({ error: "L'e-mail et le mot de passe sont obligatoires." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const rateLimitKey = `${ip}:${cleanEmail}`;

    // 1. Anti-Bruteforce Rate Limiting
    const rateCheck = checkLoginRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Trop de tentatives échouées. Compte temporairement verrouillé par sécurité. Réessayez dans ${rateCheck.retryAfterSeconds || 60} secondes.`,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 2. User Lookup
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const failInfo = recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        {
          error: "Identifiants incorrects.",
          remainingAttempts: failInfo.remaining,
        },
        { status: 401 }
      );
    }

    // 3. Status Check (CRM Banned / Suspended)
    if (user.status === "BANNED") {
      return NextResponse.json(
        { error: "Ce compte a été suspendu définitivement. Veuillez contacter le support." },
        { status: 403 }
      );
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Ce compte est temporairement suspendu." },
        { status: 403 }
      );
    }

    // 4. Password Verification
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      const failInfo = recordFailedLogin(rateLimitKey);

      if (isStaff(user.role)) {
        await logAdminAction({
          adminId: user.id,
          adminEmail: user.email,
          action: "FAILED_LOGIN",
          targetType: "AUTH",
          details: `Mot de passe erroné. Restant: ${failInfo.remaining}`,
          ipAddress: ip,
        });
      }

      return NextResponse.json(
        {
          error: "Identifiants incorrects.",
          remainingAttempts: failInfo.remaining,
        },
        { status: 401 }
      );
    }

    // Success - Reset rate limit counter
    resetLoginRateLimit(rateLimitKey);

    // 5. Check Two-Factor Authentication (2FA)
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const tempToken = await create2FaPendingToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      const response = NextResponse.json({
        require2FA: true,
        tempToken,
        message: "Code d'authentification à deux facteurs requis.",
      });

      response.cookies.set("smm_2fa_pending", tempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });

      return response;
    }

    // 6. Direct Login Completion (No 2FA or 2FA not enabled)
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Update last login metadata
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
        action: "LOGIN",
        targetType: "AUTH",
        details: `Connexion réussie (${user.role})`,
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

    res.cookies.set("smm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur de connexion" }, { status: 500 });
  }
}
