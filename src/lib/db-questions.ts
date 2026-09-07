import clientPromise from '@/lib/mongodb';
import { CategoryMeta, Question, TypeMeta } from '@/types/question';
import { CATEGORIES, QUESTION_TYPES } from '@/data/metadata';
import { recordAuditLog } from '@/lib/db-audit';
import { escapeRegex } from '@/lib/utils';

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
    createdBy: doc.createdBy || { adminId: 'system', name: 'System' },
    updatedBy: doc.updatedBy,
    updatedAt: doc.updatedAt,
  }));
}

export interface GetQuestionsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: string;
  sortBy?: 'id' | 'text' | 'category' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedQuestionsResult {
  questions: Question[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export async function getAdminQuestions(
  options: GetQuestionsOptions = {}
): Promise<PaginatedQuestionsResult> {
  const {
    page = 1,
    limit = 20,
    search = '',
    category,
    type,
    sortBy = 'id',
    sortOrder = 'asc',
  } = options;

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<Question>('questions');

  // Build filter query
  const query: Record<string, unknown> = {};

  if (search.trim()) {
    query.text = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  if (type && type !== 'all') {
    query.type = type;
  }

  const total = await collection.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const skip = (safePage - 1) * limit;

  const sortDirection = sortOrder === 'desc' ? -1 : 1;
  const sortObj: Record<string, 1 | -1> = { [sortBy]: sortDirection };

  const docs = await collection
    .find(query, { projection: { _id: 0 } })
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .toArray();

  const questions = docs.map((doc) => ({
    id: doc.id,
    text: doc.text,
    category: doc.category,
    type: doc.type,
    tags: doc.tags || [],
    createdBy: doc.createdBy || { adminId: 'system', name: 'System' },
    updatedBy: doc.updatedBy,
    updatedAt: doc.updatedAt,
  }));

  return {
    questions,
    total,
    page: safePage,
    totalPages,
    limit,
  };
}

export async function getQuestionById(id: number): Promise<Question | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const doc = await db
    .collection<Question>('questions')
    .findOne({ id }, { projection: { _id: 0 } });

  if (!doc) return null;
  return {
    id: doc.id,
    text: doc.text,
    category: doc.category,
    type: doc.type,
    tags: doc.tags || [],
    createdBy: doc.createdBy || { adminId: 'system', name: 'System' },
    updatedBy: doc.updatedBy,
    updatedAt: doc.updatedAt,
  };
}

export async function createQuestion(
  data: {
    text: string;
    category: string;
    type: string;
    tags?: string[];
    id?: number;
  },
  actor?: { id: string; name: string; email: string }
): Promise<Question> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<Question>('questions');

  let nextId = data.id;
  if (typeof nextId !== 'number' || nextId <= 0) {
    const highest = await collection.find({}).sort({ id: -1 }).limit(1).toArray();
    nextId = highest.length > 0 ? (highest[0].id || 0) + 1 : 1;
  }

  const createdBy = actor
    ? { adminId: actor.id, name: actor.name }
    : { adminId: 'system', name: 'System' };
  const now = new Date().toISOString();

  const newQuestion: Question = {
    id: nextId,
    text: data.text.trim(),
    category: data.category,
    type: data.type,
    tags: Array.isArray(data.tags) ? data.tags.map((t) => t.trim()).filter(Boolean) : [],
    createdBy,
    updatedAt: now,
  };

  await collection.updateOne(
    { id: newQuestion.id },
    { $set: newQuestion },
    { upsert: true }
  );

  if (actor) {
    await recordAuditLog({
      action: 'CREATE_QUESTION',
      actor,
      targetId: newQuestion.id,
      targetText: newQuestion.text,
    });
  }

  return newQuestion;
}

export async function updateQuestion(
  id: number,
  updates: Partial<Omit<Question, 'id'>>,
  actor?: { id: string; name: string; email: string }
): Promise<Question | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<Question>('questions');

  const updateFields: Partial<Question> = {};
  if (typeof updates.text === 'string') updateFields.text = updates.text.trim();
  if (typeof updates.category === 'string') updateFields.category = updates.category;
  if (typeof updates.type === 'string') updateFields.type = updates.type;
  if (Array.isArray(updates.tags)) {
    updateFields.tags = updates.tags.map((t) => t.trim()).filter(Boolean);
  }

  if (actor) {
    updateFields.updatedBy = { adminId: actor.id, name: actor.name };
    updateFields.updatedAt = new Date().toISOString();
  }

  const result = await collection.findOneAndUpdate(
    { id },
    { $set: updateFields },
    { returnDocument: 'after', projection: { _id: 0 } }
  );

  if (result && actor) {
    await recordAuditLog({
      action: 'UPDATE_QUESTION',
      actor,
      targetId: id,
      targetText: result.text,
    });
  }

  return result || null;
}

export async function deleteQuestion(
  id: number,
  actor?: { id: string; name: string; email: string }
): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<Question>('questions');

  let targetText: string | undefined;
  if (actor) {
    const existing = await collection.findOne({ id });
    targetText = existing?.text;
  }

  const result = await collection.deleteOne({ id });
  const success = result.deletedCount > 0;

  if (success && actor) {
    await recordAuditLog({
      action: 'DELETE_QUESTION',
      actor,
      targetId: id,
      targetText,
    });
  }

  return success;
}

export async function bulkDeleteQuestions(
  ids: number[],
  actor?: { id: string; name: string; email: string }
): Promise<number> {
  if (!ids || ids.length === 0) return 0;
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const result = await db.collection<Question>('questions').deleteMany({
    id: { $in: ids },
  });

  const deletedCount = result.deletedCount || 0;
  if (deletedCount > 0 && actor) {
    await recordAuditLog({
      action: 'BULK_DELETE_QUESTIONS',
      actor,
      targetId: ids,
      targetText: `Bulk deleted ${deletedCount} question(s)`,
    });
  }

  return deletedCount;
}

export async function bulkUpsertQuestions(
  questions: Question[]
): Promise<{ upsertedCount: number; modifiedCount: number }> {
  if (!questions || questions.length === 0) {
    return { upsertedCount: 0, modifiedCount: 0 };
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<Question>('questions');

  const ops = questions.map((q) => ({
    updateOne: {
      filter: { id: q.id },
      update: {
        $set: {
          id: q.id,
          text: q.text,
          category: q.category,
          type: q.type,
          tags: q.tags || [],
        },
      },
      upsert: true,
    },
  }));

  const res = await collection.bulkWrite(ops);
  return {
    upsertedCount: res.upsertedCount,
    modifiedCount: res.modifiedCount,
  };
}

// -------------------------------------------------------------
// Category Dynamic Management
// -------------------------------------------------------------

export async function getCategoriesWithDefaults(): Promise<CategoryMeta[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const dbCategories = await db
    .collection<CategoryMeta>('categories')
    .find({}, { projection: { _id: 0 } })
    .toArray();

  if (dbCategories.length > 0) {
    return dbCategories;
  }

  // If no dynamic categories exist yet in DB, seed from default CATEGORIES
  const defaultList = Object.values(CATEGORIES);
  try {
    const ops = defaultList.map((c) => ({
      updateOne: {
        filter: { id: c.id },
        update: { $set: c },
        upsert: true,
      },
    }));
    await db.collection('categories').bulkWrite(ops);
  } catch (err) {
    console.error('Failed to seed categories to DB:', err);
  }

  return defaultList;
}

export async function saveCategory(category: CategoryMeta): Promise<void> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection<CategoryMeta>('categories').updateOne(
    { id: category.id },
    { $set: category },
    { upsert: true }
  );
}

export async function deleteCategory(id: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const result = await db.collection('categories').deleteOne({ id });
  return result.deletedCount > 0;
}

// -------------------------------------------------------------
// Question Types Dynamic Management
// -------------------------------------------------------------

export async function getQuestionTypesWithDefaults(): Promise<TypeMeta[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const dbTypes = await db
    .collection<TypeMeta>('question_types')
    .find({}, { projection: { _id: 0 } })
    .toArray();

  if (dbTypes.length > 0) {
    return dbTypes;
  }

  // Seed default question types if empty
  const defaultList = Object.values(QUESTION_TYPES);
  try {
    const ops = defaultList.map((t) => ({
      updateOne: {
        filter: { id: t.id },
        update: { $set: t },
        upsert: true,
      },
    }));
    await db.collection('question_types').bulkWrite(ops);
  } catch (err) {
    console.error('Failed to seed question types to DB:', err);
  }

  return defaultList;
}

export async function saveQuestionType(typeMeta: TypeMeta): Promise<void> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection<TypeMeta>('question_types').updateOne(
    { id: typeMeta.id },
    { $set: typeMeta },
    { upsert: true }
  );
}

export async function deleteQuestionType(id: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const result = await db.collection('question_types').deleteOne({ id });
  return result.deletedCount > 0;
}
