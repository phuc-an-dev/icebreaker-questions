import { NextRequest, NextResponse } from 'next/server';
import { getServerCurrentAdmin } from '@/lib/auth';
import { getAuditLogs } from '@/lib/db-audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const currentAdmin = await getServerCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (currentAdmin.role !== 'master_admin') {
    return NextResponse.json(
      { error: 'Forbidden: Only Master Admin can view audit logs' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || '';
  const action = searchParams.get('action') || undefined;

  try {
    const result = await getAuditLogs({
      page,
      limit,
      search,
      action,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
