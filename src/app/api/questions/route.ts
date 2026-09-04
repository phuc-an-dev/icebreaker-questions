import { NextResponse } from 'next/server';
import { getAllQuestions } from '@/lib/db-questions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const questions = await getAllQuestions();
    return NextResponse.json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('Failed to fetch questions from MongoDB:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch questions from database',
      },
      { status: 500 }
    );
  }
}
