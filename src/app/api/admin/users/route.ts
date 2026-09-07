import { NextRequest, NextResponse } from 'next/server';
import { getServerCurrentAdmin } from '@/lib/auth';
import { getAllAdmins, createAdminUser } from '@/lib/db-admins';

export const dynamic = 'force-dynamic';

export async function GET() {
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

  try {
    const users = await getAllAdmins();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const currentAdmin = await getServerCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (currentAdmin.role !== 'master_admin') {
    return NextResponse.json(
      { error: 'Forbidden: Only Master Admin can create administrators' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { email, name, password, role = 'admin', mustChangePassword = true } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Admin full name is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const newUser = await createAdminUser({
      email: email.trim(),
      name: name.trim(),
      password,
      role: role === 'master_admin' ? 'master_admin' : 'admin',
      mustChangePassword: Boolean(mustChangePassword),
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create admin user';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
