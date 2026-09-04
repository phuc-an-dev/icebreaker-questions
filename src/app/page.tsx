import { getAllQuestions } from '@/lib/db-questions';
import { IcebreakerClient } from '@/components/IcebreakerClient';
import { Question } from '@/types/question';

export const dynamic = 'force-dynamic';

export default async function IcebreakerPage() {
  let initialQuestions: Question[] = [];
  try {
    initialQuestions = await getAllQuestions();
  } catch (error) {
    console.error('Server error fetching questions from MongoDB:', error);
  }

  return <IcebreakerClient initialQuestions={initialQuestions} />;
}
