import { NextRequest, NextResponse } from 'next/server';
import { isServerAdminAuthenticated } from '@/lib/auth';
import {
  getCategoriesWithDefaults,
  saveCategory,
  deleteCategory,
} from '@/lib/db-questions';

export async function GET() {
  const authenticated = await isServerAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await getCategoriesWithDefaults();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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

    const category = {
      id: body.id.toLowerCase().trim().replace(/\s+/g, '-'),
      label: body.label.trim(),
      description: body.description?.trim() || '',
      color: body.color || '#3b82f6',
      gradient:
        body.gradient ||
        `linear-gradient(135deg, ${body.color || '#3b82f6'} 0%, #1d4ed8 100%)`,
      glowColor: body.glowColor || 'rgba(59, 130, 246, 0.4)',
      borderGlow: body.borderGlow || 'rgba(59, 130, 246, 0.6)',
      iconName: body.iconName || 'HelpCircle',
    };

    await saveCategory(category);
    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Error saving category:', error);
    return NextResponse.json(
      { error: 'Failed to save category' },
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
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  }

  try {
    const deleted = await deleteCategory(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
