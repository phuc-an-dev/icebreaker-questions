import { NextRequest, NextResponse } from 'next/server';
import { isServerAdminAuthenticated } from '@/lib/auth';
import { bulkUpsertQuestions } from '@/lib/db-questions';
import { Question } from '@/types/question';

function parseCsv(csvText: string): Question[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  // Parse header
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idIdx = header.indexOf('id');
  const textIdx = header.indexOf('text');
  const catIdx = header.indexOf('category');
  const typeIdx = header.indexOf('type');
  const tagsIdx = header.indexOf('tags');

  const questions: Question[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // CSV parser regex that handles quoted values with commas
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      let val = match[1] ?? '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val);
      if (regex.lastIndex >= line.length) break;
    }

    const id = idIdx !== -1 ? parseInt(matches[idIdx], 10) : i;
    const text = textIdx !== -1 ? matches[textIdx] : '';
    const category = catIdx !== -1 ? matches[catIdx] : 'group';
    const type = typeIdx !== -1 ? matches[typeIdx] : 'open';
    const rawTags = tagsIdx !== -1 ? matches[tagsIdx] : '';

    if (!text) continue;

    const tags = rawTags
      ? rawTags
          .split(/[;,]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    questions.push({
      id: isNaN(id) ? i : id,
      text,
      category,
      type,
      tags,
    });
  }

  return questions;
}

export async function POST(request: NextRequest) {
  const authenticated = await isServerAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let questionsToImport: Question[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (Array.isArray(body)) {
        questionsToImport = body;
      } else if (Array.isArray(body.questions)) {
        questionsToImport = body.questions;
      } else if (typeof body.csvText === 'string') {
        questionsToImport = parseCsv(body.csvText);
      }
    } else if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      const text = await request.text();
      questionsToImport = parseCsv(text);
    }

    if (!questionsToImport || questionsToImport.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions found to import' },
        { status: 400 }
      );
    }

    // Clean and validate questions
    const validQuestions: Question[] = questionsToImport
      .filter((q) => q && typeof q.text === 'string' && q.text.trim())
      .map((q, idx) => ({
        id: typeof q.id === 'number' && !isNaN(q.id) ? q.id : idx + 1000,
        text: q.text.trim(),
        category: q.category || 'group',
        type: q.type || 'open',
        tags: Array.isArray(q.tags)
          ? q.tags.map((t) => String(t).trim()).filter(Boolean)
          : [],
      }));

    if (validQuestions.length === 0) {
      return NextResponse.json(
        { error: 'All questions in import payload were invalid or missing text' },
        { status: 400 }
      );
    }

    const result = await bulkUpsertQuestions(validQuestions);

    return NextResponse.json({
      success: true,
      importedCount: validQuestions.length,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error importing questions:', error);
    return NextResponse.json(
      { error: 'Failed to import questions' },
      { status: 500 }
    );
  }
}
