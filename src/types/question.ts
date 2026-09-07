export type CategoryId =
  | 'group'
  | 'fun'
  | 'memory'
  | 'work'
  | 'relationship'
  | 'growth'
  | 'faith'
  | 'game'
  | (string & {});

export type QuestionTypeId =
  | 'open'
  | 'rotating'
  | 'pick1'
  | 'pick2'
  | 'pick3'
  | 'rate'
  | 'guess'
  | 'interview'
  | 'roleplay'
  | 'vote'
  | 'chain'
  | 'writeguess'
  | 'debate'
  | 'challenge'
  | (string & {});

export interface QuestionAttribution {
  adminId: string;
  name: string;
}

export interface Question {
  id: number;
  text: string;
  category: CategoryId;
  type: QuestionTypeId;
  tags: string[];
  createdBy?: QuestionAttribution;
  updatedBy?: QuestionAttribution;
  updatedAt?: string;
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  description: string;
  color: string;      // HEX
  gradient: string;   // CSS gradient
  glowColor: string;  // RGBA glow
  borderGlow: string; // RGBA border
  iconName: string;   // Lucide icon identifier
}

export interface TypeMeta {
  id: QuestionTypeId;
  label: string;
  hint: string;
  iconName: string;
}

export interface FilterState {
  categories: CategoryId[];
  types: QuestionTypeId[];
  tags: string[];
  search: string;
  hideAsked: boolean;
  onlyFavorites: boolean;
}
