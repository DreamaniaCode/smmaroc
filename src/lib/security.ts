import crypto from "node:crypto";
import { db } from "./db";

// In-memory rate limiting store for login attempts
interface RateLimitEntry {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt && (!entry.lockedUntil || now > entry.lockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return { allowed: true, remaining: 5 };
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  if (now > entry.resetAt) {
    rateLimitStore.delete(key);
    return { allowed: true, remaining: 5 };
  }

  const remaining = Math.max(0, 5 - entry.count);
  return { allowed: entry.count < 5, remaining };
}

export function recordFailedLogin(key: string): {
  remaining: number;
  locked: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes window
  const lockoutMs = 15 * 60 * 1000; // 15 minutes lockout

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
  } else {
    entry.count += 1;
  }

  if (entry.count >= 5) {
    entry.lockedUntil = now + lockoutMs;
    rateLimitStore.set(key, entry);
    return { remaining: 0, locked: true, retryAfterSeconds: Math.ceil(lockoutMs / 1000) };
  }

  rateLimitStore.set(key, entry);
  return { remaining: Math.max(0, 5 - entry.count), locked: false };
}

export function resetLoginRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// -------------------------------------------------------------
// Audit Logging
// -------------------------------------------------------------

export interface AuditLogParams {
  adminId: string;
  adminEmail: string;
  action: string;
  target?: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
}

export async function logAdminAction(params: AuditLogParams): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        action: params.action,
        targetType: params.targetType || (params.target ? "GENERAL" : null),
        targetId: params.targetId || params.target || null,
        details: params.details || null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err) {
    console.error("[AUDIT_LOG_ERROR]", err);
  }
}

// -------------------------------------------------------------
// Two-Factor Authentication (TOTP - RFC 6238)
// -------------------------------------------------------------

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

function base32ToBuffer(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, "");
  let bits = "";
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function computeTotp(secret: string, counter: number): string {
  const key = base32ToBuffer(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(buffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

export function verifyTotpToken(secret: string, token: string, window = 1): boolean {
  if (!secret || !token) return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const expected = computeTotp(secret, currentCounter + i);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

export function generateTotpUri(email: string, secret: string, issuer = "SMMaroc"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export function isStrongPassword(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 10) {
    return { valid: false, reason: "Le mot de passe doit comporter au moins 10 caractères." };
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return { valid: false, reason: "Le mot de passe doit contenir des majuscules et des minuscules." };
  }
  if (!/\d/.test(password)) {
    return { valid: false, reason: "Le mot de passe doit contenir au moins un chiffre." };
  }
  return { valid: true };
}
