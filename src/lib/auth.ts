import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "smm-agency-panel-fallback-secret-key-32charsmin"
);

export interface TokenPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "USER";
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Ensures at least one admin user exists in the system.
 */
export async function ensureInitialAdmin() {
  const count = await db.user.count({ where: { role: "ADMIN" } });
  if (count === 0) {
    const defaultEmail = process.env.ADMIN_INITIAL_EMAIL || "admin@agency.com";
    const defaultPass = process.env.ADMIN_INITIAL_PASSWORD || "AdminPassword123!";
    const hashedPassword = await hashPassword(defaultPass);

    await db.user.create({
      data: {
        email: defaultEmail.toLowerCase(),
        name: "SMMaroc Administrator",
        passwordHash: hashedPassword,
        role: "ADMIN",
        balance: 999999.0,
        currency: "MAD",
      },
    });
    console.log(`[AUTH] Initial admin account created: ${defaultEmail}`);
  }
}
