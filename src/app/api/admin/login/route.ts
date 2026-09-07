import { NextResponse } from 'next/server';
import {
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from '@/lib/auth';
import {
  findAdminByEmail,
  verifyPasswordHash,
  recordAdminLogin,
  seedMasterAdminIfNeeded,
} from '@/lib/db-admins';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Ensure master admin is seeded if first run
    await seedMasterAdminIfNeeded();

    const body = await req.json();
    const { email, password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Determine admin account to verify
    let admin = null;
    if (email && typeof email === 'string' && email.trim()) {
      admin = await findAdminByEmail(email.trim());
    } else {
      // Fallback: Check if password matches master admin
      const masterEmail = (process.env.MASTER_ADMIN_EMAIL || 'admin@icebreaker.local').toLowerCase().trim();
      const candidateMaster = await findAdminByEmail(masterEmail);
      if (candidateMaster && verifyPasswordHash(password, candidateMaster.salt, candidateMaster.passwordHash)) {
        admin = candidateMaster;
      }
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValidPassword = verifyPasswordHash(password, admin.salt, admin.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (admin.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your account has been suspended. Please contact the Master Admin.',
        },
        { status: 403 }
      );
    }

    await recordAdminLogin(admin.id);

    const token = createAdminSessionToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      tokenVersion: admin.tokenVersion || 1,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        mustChangePassword: Boolean(admin.mustChangePassword),
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
