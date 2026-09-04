import { NextResponse } from 'next/server';
import { isServerAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authenticated = await isServerAdminAuthenticated();
  return NextResponse.json({ authenticated });
}
