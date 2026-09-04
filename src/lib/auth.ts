import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'icebreaker_admin_session';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'icebreaker_default_secret_key';

// 7 days in milliseconds
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function verifyPassword(inputPassword: string): boolean {
  if (!inputPassword) return false;
  // Constant-time string comparison to prevent timing attacks
  try {
    const a = Buffer.from(inputPassword);
    const b = Buffer.from(ADMIN_PASSWORD);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE;
  const payload = `${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

export function verifySessionToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(expiresAtStr)
    .digest('hex');

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isServerAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    return verifySessionToken(sessionCookie?.value);
  } catch {
    return false;
  }
}
