import { NextRequest, NextResponse } from 'next/server';
import { isServerAdminAuthenticated } from '@/lib/auth';
import { getAllQuestions } from '@/lib/db-questions';

export async function GET(request: NextRequest) {
  const authenticated = await isServerAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  try {
    const questions = await getAllQuestions();

    if (format === 'csv') {
      const header = ['id', 'text', 'category', 'type', 'tags'];
      const rows = questions.map((q) => {
        const escapedText = `"${(q.text || '').replace(/"/g, '""')}"`;
        const tagsStr = `"${(q.tags || []).join(';')}"`;
        return [q.id, escapedText, q.category, q.type, tagsStr].join(',');
      });
      const csvContent = [header.join(','), ...rows].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="icebreaker_questions_${Date.now()}.csv"`,
        },
      });
    }

    // Default JSON
    return new NextResponse(JSON.stringify(questions, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="icebreaker_questions_${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting questions:', error);
    return NextResponse.json(
      { error: 'Failed to export questions' },
      { status: 500 }
    );
  }
}
