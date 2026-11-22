import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { db } from "./db";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "smm-agency-panel-fallback-secret-key-32charsmin";
  return new TextEncoder().encode(secret);
}

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "OPERATOR" | "USER";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole | string;
  name: string;
  is2faPending?: boolean;
}

export function isSuperAdmin(role?: string): boolean {
  return role === "SUPER_ADMIN";
}

export function isAdmin(role?: string): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isStaff(role?: string): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "SUPPORT" || role === "OPERATOR";
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload, is2faPending: false })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function create2FaPendingToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload, is2faPending: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m") // 5 minutes window to submit OTP
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, getJwtSecret());
    return verified.payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Ensures at least one admin user exists in the system without hardcoded credentials.
 */
export async function ensureInitialAdmin() {
  const count = await db.user.count({
    where: {
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
    },
  });

  if (count === 0) {
    const envEmail = process.env.ADMIN_INITIAL_EMAIL;
    const envPass = process.env.ADMIN_INITIAL_PASSWORD;

    // Only create initial admin if environment variables are provided
    if (envEmail && envPass) {
      const hashedPassword = await hashPassword(envPass);
      await db.user.create({
        data: {
          email: envEmail.toLowerCase().trim(),
          name: "SMMaroc Super Administrator",
          passwordHash: hashedPassword,
          role: "SUPER_ADMIN",
          balance: 999999.0,
          currency: "MAD",
          forcePasswordChange: true,
        },
      });
      console.log(`[AUTH] Initial Super Admin created for: ${envEmail}`);
    } else {
      // Generate a secure random password if no credentials were provided
      const randomPass = "SMM-" + crypto.randomBytes(8).toString("hex") + "!2026";
      const hashedPassword = await hashPassword(randomPass);
      const fallbackEmail = "admin@smmaroc.site";
      await db.user.create({
        data: {
          email: fallbackEmail,
          name: "SMMaroc Super Administrator",
          passwordHash: hashedPassword,
          role: "SUPER_ADMIN",
          balance: 999999.0,
          currency: "MAD",
          forcePasswordChange: true,
        },
      });
      console.warn(`[AUTH_SECURITY_NOTICE] Initial Super Admin generated automatically.`);
      console.warn(`[AUTH_SECURITY_NOTICE] Email: ${fallbackEmail}`);
      console.warn(`[AUTH_SECURITY_NOTICE] Temporary Password: ${randomPass}`);
    }
  }
}
