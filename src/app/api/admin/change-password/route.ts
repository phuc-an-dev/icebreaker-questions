import { NextRequest, NextResponse } from 'next/server';
import { getServerCurrentAdmin, createAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { changeAdminPassword, findAdminById, verifyPasswordHash } from '@/lib/db-admins';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const currentAdmin = await getServerCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const fullAdmin = await findAdminById(currentAdmin.id);
    if (!fullAdmin) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }

    // If mustChangePassword is NOT set, require current password verification
    if (!fullAdmin.mustChangePassword) {
      if (!currentPassword || !verifyPasswordHash(currentPassword, fullAdmin.salt, fullAdmin.passwordHash)) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
    }

    await changeAdminPassword(currentAdmin.id, newPassword, true);

    // Refresh session cookie with the new tokenVersion
    const updatedAdmin = await findAdminById(currentAdmin.id);
    const token = createAdminSessionToken({
      adminId: currentAdmin.id,
      email: currentAdmin.email,
      role: currentAdmin.role,
      tokenVersion: updatedAdmin?.tokenVersion || 1,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
