import { getAllQuestions, getCategoriesWithDefaults, getQuestionTypesWithDefaults } from '@/lib/db-questions';
import { IcebreakerClient } from '@/components/IcebreakerClient';
import { Question, CategoryMeta, TypeMeta } from '@/types/question';

export const dynamic = 'force-dynamic';

export default async function IcebreakerPage() {
  let initialQuestions: Question[] = [];
  let initialCategories: CategoryMeta[] = [];
  let initialTypes: TypeMeta[] = [];

  try {
    const [questions, categories, types] = await Promise.all([
      getAllQuestions(),
      getCategoriesWithDefaults(),
      getQuestionTypesWithDefaults(),
    ]);
    initialQuestions = questions;
    initialCategories = categories;
    initialTypes = types;
  } catch (error) {
    console.error('Server error fetching questions and categories from MongoDB:', error);
  }

  return (
    <IcebreakerClient
      initialQuestions={initialQuestions}
      initialCategories={initialCategories}
      initialTypes={initialTypes}
    />
  );
}
