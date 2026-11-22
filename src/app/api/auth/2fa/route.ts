import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { verifySessionToken, verifyPassword, isStaff } from "@/lib/auth";
import {
  generateTotpSecret,
  generateTotpUri,
  verifyTotpToken,
  generateBackupCodes,
  logAdminAction,
} from "@/lib/security";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({
      enabled: true,
      hasBackupCodes: Boolean(user.twoFactorBackupCodes),
    });
  }

  // Generate new secret for setup
  const secret = generateTotpSecret(20);
  const uri = generateTotpUri(user.email, secret, "SMMaroc");
  const qrCodeDataUrl = await QRCode.toDataURL(uri, {
    width: 260,
    margin: 2,
    color: {
      dark: "#06080F",
      light: "#FFFFFF",
    },
  });

  // Temporarily store the setup secret until verified
  await db.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret },
  });

  return NextResponse.json({
    enabled: false,
    secret,
    qrCodeDataUrl,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code 2FA obligatoire." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: "Veuillez d'abord initialiser la configuration 2FA." }, { status: 400 });
    }

    const isValid = verifyTotpToken(user.twoFactorSecret, code);
    if (!isValid) {
      return NextResponse.json({ error: "Code invalide. Vérifiez l'heure de votre appareil et réessayez." }, { status: 400 });
    }

    const backupCodes = generateBackupCodes(8);
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes.join(","),
      },
    });

    if (isStaff(user.role)) {
      await logAdminAction({
        adminId: user.id,
        adminEmail: user.email,
        action: "2FA_ENABLED",
        targetType: "AUTH",
        details: "Activation réussie de la Double Authentification TOTP",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Double authentification activée avec succès.",
      backupCodes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur d'activation 2FA" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "Le mot de passe actuel est requis pour désactiver la 2FA." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    if (isStaff(user.role)) {
      await logAdminAction({
        adminId: user.id,
        adminEmail: user.email,
        action: "2FA_DISABLED",
        targetType: "AUTH",
        details: "Désactivation de la Double Authentification",
      });
    }

    return NextResponse.json({
      success: true,
      message: "La double authentification a été désactivée.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de désactivation 2FA" }, { status: 500 });
  }
}
