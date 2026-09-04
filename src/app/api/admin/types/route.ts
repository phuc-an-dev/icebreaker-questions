import { NextRequest, NextResponse } from 'next/server';
import { isServerAdminAuthenticated } from '@/lib/auth';
import {
  getQuestionTypesWithDefaults,
  saveQuestionType,
  deleteQuestionType,
} from '@/lib/db-questions';

export async function GET() {
  const authenticated = await isServerAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const types = await getQuestionTypesWithDefaults();
    return NextResponse.json({ types });
  } catch (error) {
    console.error('Error fetching question types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question types' },
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
    if (!body.id || !body.label) {
      return NextResponse.json(
        { error: 'ID and Label are required' },
        { status: 400 }
      );
    }

    const typeMeta = {
      id: body.id.toLowerCase().trim().replace(/\s+/g, '-'),
      label: body.label.trim(),
      hint: body.hint?.trim() || '',
      iconName: body.iconName || 'MessageSquareQuote',
    };

    await saveQuestionType(typeMeta);
    return NextResponse.json({ success: true, type: typeMeta });
  } catch (error) {
    console.error('Error saving question type:', error);
    return NextResponse.json(
      { error: 'Failed to save question type' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authenticated = await isServerAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Type ID is required' }, { status: 400 });
  }

  try {
    const deleted = await deleteQuestionType(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('Error deleting question type:', error);
    return NextResponse.json(
      { error: 'Failed to delete question type' },
      { status: 500 }
    );
  }
}
