import { NextResponse } from 'next/server';
import { getAllQuestions, getCategoriesWithDefaults, getQuestionTypesWithDefaults } from '@/lib/db-questions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [questions, categories, types] = await Promise.all([
      getAllQuestions(),
      getCategoriesWithDefaults(),
      getQuestionTypesWithDefaults(),
    ]);
    return NextResponse.json({
      success: true,
      count: questions.length,
      data: questions,
      categories,
      types,
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
