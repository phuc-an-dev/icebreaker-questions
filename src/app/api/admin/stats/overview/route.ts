import { NextResponse } from 'next/server';
import { getServerCurrentAdmin } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { getCategoriesWithDefaults, getQuestionTypesWithDefaults } from '@/lib/db-questions';
import { AdminStatsOverview } from '@/types/stats';

export const dynamic = 'force-dynamic';

const DB_NAME = process.env.MONGODB_DB || 'icebreaker_db';

export async function GET() {
  const currentAdmin = await getServerCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection('questions');

    const [facetResults, categories, types] = await Promise.all([
      collection
        .aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              byCategory: [
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
              ],
              byType: [
                { $group: { _id: '$type', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
              ],
              byAuthor: [
                {
                  $group: {
                    _id: {
                      adminId: { $ifNull: ['$createdBy.adminId', 'system'] },
                      name: { $ifNull: ['$createdBy.name', 'System Seed'] },
                    },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { count: -1 } },
              ],
              tags: [
                { $unwind: '$tags' },
                { $match: { tags: { $type: 'string', $nin: ['', null] } } },
                { $group: { _id: '$tags', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 15 },
              ],
              healthStats: [
                {
                  $project: {
                    textLength: { $strLenCP: { $ifNull: ['$text', ''] } },
                    isUntagged: {
                      $cond: [
                        {
                          $or: [
                            { $not: ['$tags'] },
                            { $eq: [{ $type: '$tags' }, 'missing'] },
                            { $eq: [{ $size: { $ifNull: ['$tags', []] } }, 0] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    avgLength: { $avg: '$textLength' },
                    minLength: { $min: '$textLength' },
                    maxLength: { $max: '$textLength' },
                    untaggedCount: { $sum: '$isUntagged' },
                    longQuestionsCount: {
                      $sum: { $cond: [{ $gt: ['$textLength', 160] }, 1, 0] },
                    },
                    shortQuestionsCount: {
                      $sum: { $cond: [{ $lt: ['$textLength', 20] }, 1, 0] },
                    },
                  },
                },
              ],
            },
          },
        ])
        .toArray(),
      getCategoriesWithDefaults(),
      getQuestionTypesWithDefaults(),
    ]);

    const facet = facetResults[0] || {};
    const totalQuestions = facet.total?.[0]?.count || 0;

    // Build Category Distribution with meta mapping
    const rawCategoryCounts: { _id: string; count: number }[] = facet.byCategory || [];
    const categoryCountMap = new Map<string, number>();
    for (const item of rawCategoryCounts) {
      if (item._id) categoryCountMap.set(item._id.toLowerCase(), item.count);
    }

    const categoryDistribution = categories.map((cat) => {
      const count = categoryCountMap.get(cat.id.toLowerCase()) || 0;
      const percentage = totalQuestions > 0 ? Math.round((count / totalQuestions) * 1000) / 10 : 0;
      return {
        id: cat.id,
        label: cat.label,
        color: cat.color || '#3b82f6',
        count,
        percentage,
      };
    }).sort((a, b) => b.count - a.count);

    // Identify orphan categories (0 questions)
    const orphanCategories = categoryDistribution
      .filter((c) => c.count === 0)
      .map((c) => ({ id: c.id, label: c.label }));

    const activeCategoriesCount = categoryDistribution.filter((c) => c.count > 0).length;

    // Build Type Distribution with meta mapping
    const rawTypeCounts: { _id: string; count: number }[] = facet.byType || [];
    const typeCountMap = new Map<string, number>();
    for (const item of rawTypeCounts) {
      if (item._id) typeCountMap.set(item._id.toLowerCase(), item.count);
    }

    const typeDistribution = types.map((t) => {
      const count = typeCountMap.get(t.id.toLowerCase()) || 0;
      const percentage = totalQuestions > 0 ? Math.round((count / totalQuestions) * 1000) / 10 : 0;
      return {
        id: t.id,
        label: t.label,
        iconName: t.iconName || 'HelpCircle',
        count,
        percentage,
      };
    }).sort((a, b) => b.count - a.count);

    // Identify orphan types (0 questions)
    const orphanTypes = typeDistribution
      .filter((t) => t.count === 0)
      .map((t) => ({ id: t.id, label: t.label }));

    const activeTypesCount = typeDistribution.filter((t) => t.count > 0).length;

    // Authors / Contributors breakdown
    const rawAuthorCounts: { _id: { adminId: string; name: string }; count: number }[] = facet.byAuthor || [];
    let seedCount = 0;
    let humanCount = 0;
    const authorList: { id: string; name: string; count: number; percentage: number }[] = [];

    for (const item of rawAuthorCounts) {
      const adminId = item._id?.adminId || 'system';
      const name = item._id?.name || 'System Seed';
      const count = item.count;
      const percentage = totalQuestions > 0 ? Math.round((count / totalQuestions) * 1000) / 10 : 0;

      if (adminId === 'system' || name.toLowerCase().includes('system')) {
        seedCount += count;
      } else {
        humanCount += count;
        authorList.push({ id: adminId, name, count, percentage });
      }
    }

    // Top 3 human authors
    const topAuthors = authorList.slice(0, 3);
    const humanPercentage = totalQuestions > 0 ? Math.round((humanCount / totalQuestions) * 1000) / 10 : 0;

    // Health Stats
    const rawHealth = facet.healthStats?.[0] || {};
    const averageTextLength = Math.round(rawHealth.avgLength || 0);
    const minTextLength = rawHealth.minLength || 0;
    const maxTextLength = rawHealth.maxLength || 0;
    const untaggedCount = rawHealth.untaggedCount || 0;
    const untaggedPercentage = totalQuestions > 0 ? Math.round((untaggedCount / totalQuestions) * 1000) / 10 : 0;
    const longQuestionsCount = rawHealth.longQuestionsCount || 0;
    const shortQuestionsCount = rawHealth.shortQuestionsCount || 0;

    // Tags Frequency
    const rawTags: { _id: string; count: number }[] = facet.tags || [];
    const topTags = rawTags.map((t) => ({ tag: t._id, count: t.count }));

    const overview: AdminStatsOverview = {
      kpis: {
        totalQuestions,
        activeCategoriesCount,
        totalCategoriesCount: categories.length,
        activeTypesCount,
        totalTypesCount: types.length,
        untaggedCount,
        untaggedPercentage,
        humanCreatedCount: humanCount,
        seedCreatedCount: seedCount,
        humanPercentage,
      },
      categoryDistribution,
      typeDistribution,
      dataHealth: {
        averageTextLength,
        minTextLength,
        maxTextLength,
        longQuestionsCount,
        shortQuestionsCount,
        topTags,
        orphanCategories,
        orphanTypes,
      },
      contributors: {
        topAuthors,
        seedCount,
        humanCount,
        humanPercentage,
      },
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error('Error in GET /api/admin/stats/overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin overview statistics' },
      { status: 500 }
    );
  }
}
