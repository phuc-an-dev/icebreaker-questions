import clientPromise from '@/lib/mongodb';
import { Question } from '@/types/question';

const DB_NAME = process.env.MONGODB_DB || 'icebreaker_db';

export async function getAllQuestions(): Promise<Question[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const questions = await db
    .collection<Question>('questions')
    .find({}, { projection: { _id: 0 } })
    .sort({ id: 1 })
    .toArray();

  return questions.map((doc) => ({
    id: doc.id,
    text: doc.text,
    category: doc.category,
    type: doc.type,
    tags: doc.tags || [],
  }));
}
