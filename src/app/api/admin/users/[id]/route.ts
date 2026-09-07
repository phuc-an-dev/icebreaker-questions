import { NextRequest, NextResponse } from 'next/server';
import { getServerCurrentAdmin } from '@/lib/auth';
import {
  updateAdminUser,
  changeAdminPassword,
  deleteAdminUser,
  findAdminById,
} from '@/lib/db-admins';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentAdmin = await getServerCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (currentAdmin.role !== 'master_admin') {
    return NextResponse.json(
      { error: 'Forbidden: Only Master Admin can manage administrators' },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status, name, role, newPassword } = body;

    const target = await findAdminById(id);
    if (!target) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Safety: Master Admin cannot suspend or demote themselves
    if (currentAdmin.id === id) {
      if (status === 'suspended') {
        return NextResponse.json(
          { error: 'You cannot suspend your own Master Admin account' },
          { status: 400 }
        );
      }
      if (role && role !== 'master_admin') {
        return NextResponse.json(
          { error: 'You cannot demote your own Master Admin account' },
          { status: 400 }
        );
      }
    }

    // Reset password branch
    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      await changeAdminPassword(id, newPassword, false); // Keep or set mustChangePassword flag
    }

    // Status / details update branch
    if (status || name || role) {
      const updated = await updateAdminUser(id, {
        status: status === 'suspended' ? 'suspended' : status === 'active' ? 'active' : undefined,
        name: typeof name === 'string' && name.trim() ? name.trim() : undefined,
        role: role === 'master_admin' ? 'master_admin' : role === 'admin' ? 'admin' : undefined,
      });
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ success: true, message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentAdmin = await getServerCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (currentAdmin.role !== 'master_admin') {
    return NextResponse.json(
      { error: 'Forbidden: Only Master Admin can delete administrators' },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
  }

  if (currentAdmin.id === id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account' },
      { status: 400 }
    );
  }

  try {
    const result = await deleteAdminUser(id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete admin' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}
