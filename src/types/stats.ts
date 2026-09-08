export interface CategoryDistributionItem {
  id: string;
  label: string;
  color: string;
  count: number;
  percentage: number;
}

export interface TypeDistributionItem {
  id: string;
  label: string;
  iconName: string;
  count: number;
  percentage: number;
}

export interface AuthorContributionItem {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

export interface TagFrequencyItem {
  tag: string;
  count: number;
}

export interface OrphanMetaItem {
  id: string;
  label: string;
}

export interface AdminStatsOverview {
  kpis: {
    totalQuestions: number;
    activeCategoriesCount: number;
    totalCategoriesCount: number;
    activeTypesCount: number;
    totalTypesCount: number;
    untaggedCount: number;
    untaggedPercentage: number;
    humanCreatedCount: number;
    seedCreatedCount: number;
    humanPercentage: number;
  };

  categoryDistribution: CategoryDistributionItem[];
  typeDistribution: TypeDistributionItem[];

  dataHealth: {
    averageTextLength: number;
    minTextLength: number;
    maxTextLength: number;
    longQuestionsCount: number; // > 160 characters
    shortQuestionsCount: number; // < 20 characters
    topTags: TagFrequencyItem[];
    orphanCategories: OrphanMetaItem[];
    orphanTypes: OrphanMetaItem[];
  };

  contributors: {
    topAuthors: AuthorContributionItem[];
    seedCount: number;
    humanCount: number;
    humanPercentage: number;
  };
}
