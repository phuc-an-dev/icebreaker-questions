import crypto from 'crypto';
import { cookies } from 'next/headers';
import { AdminRole, AdminUserPublic } from '@/types/admin';
import {
  findAdminById,
  seedMasterAdminIfNeeded,
} from '@/lib/db-admins';

export const ADMIN_COOKIE_NAME = 'icebreaker_admin_session';

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'icebreaker_default_secret_key';
// 7 days in milliseconds
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export interface SessionPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  tokenVersion: number;
  exp: number;
}

export function createAdminSessionToken(data: {
  adminId: string;
  email: string;
  role: AdminRole;
  tokenVersion: number;
}): string {
  const payload: SessionPayload = {
    adminId: data.adminId,
    email: data.email,
    role: data.role,
    tokenVersion: data.tokenVersion,
    exp: Date.now() + SESSION_MAX_AGE,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('hex');

  return `${encodedPayload}.${signature}`;
}

export function verifyTokenSignature(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('hex');

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload: SessionPayload = JSON.parse(payloadJson);

    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Validates the current admin session with Instant Revocation check:
 * 1. Checks token signature & expiration
 * 2. Checks active status in MongoDB
 * 3. Checks tokenVersion in MongoDB to instantly revoke sessions on password reset / suspension
 */
export async function getServerCurrentAdmin(): Promise<AdminUserPublic | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const payload = verifyTokenSignature(sessionCookie.value);
    if (!payload?.adminId) return null;

    const admin = await findAdminById(payload.adminId);
    if (!admin) return null;

    // Instant revocation checks
    if (admin.status !== 'active') return null;
    if (admin.tokenVersion !== payload.tokenVersion) return null;

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
      mustChangePassword: admin.mustChangePassword,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt,
    };
  } catch (err) {
    console.error('Error verifying admin session:', err);
    return null;
  }
}

export async function isServerAdminAuthenticated(): Promise<boolean> {
  const currentAdmin = await getServerCurrentAdmin();
  return currentAdmin !== null;
}

export async function isServerMasterAdmin(): Promise<boolean> {
  const currentAdmin = await getServerCurrentAdmin();
  return currentAdmin?.role === 'master_admin';
}

// Auto seed helper for routes
export { seedMasterAdminIfNeeded };
