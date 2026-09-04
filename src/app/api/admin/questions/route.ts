import { NextRequest, NextResponse } from 'next/server';
import { isServerAdminAuthenticated } from '@/lib/auth';
import {
  getAdminQuestions,
  createQuestion,
  bulkDeleteQuestions,
} from '@/lib/db-questions';

export async function GET(request: NextRequest) {
  const authenticated = await isServerAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || undefined;
  const type = searchParams.get('type') || undefined;
  const sortBy = (searchParams.get('sortBy') as 'id' | 'text' | 'category' | 'type') || 'id';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

  try {
    const result = await getAdminQuestions({
      page,
      limit,
      search,
      category,
      type,
      sortBy,
      sortOrder,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching questions in admin API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await isServerAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }
    if (!body.category || typeof body.category !== 'string') {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }
    if (!body.type || typeof body.type !== 'string') {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }

    const question = await createQuestion({
      text: body.text,
      category: body.category,
      type: body.type,
      tags: body.tags,
      id: body.id ? parseInt(body.id, 10) : undefined,
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authenticated = await isServerAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ids = body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty ids list' },
        { status: 400 }
      );
    }

    const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
    const deletedCount = await bulkDeleteQuestions(numericIds);

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Error in bulk delete questions:', error);
    return NextResponse.json(
      { error: 'Failed to bulk delete questions' },
      { status: 500 }
    );
  }
}
