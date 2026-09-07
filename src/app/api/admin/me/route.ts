import { NextResponse } from 'next/server';
import { getServerCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentAdmin = await getServerCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ user: currentAdmin });
}
