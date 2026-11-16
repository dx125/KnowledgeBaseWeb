// Query keys for everything the app reads from the KB API — the single place they are built.
// Every content key carries `locale` and `includeInternal`, so each language / scope is
// cached separately. Everything lives under ['kb'], so invalidating or clearing that root
// covers all API data.
import type { Locale } from '../i18n';

export interface ScopeParams {
  locale: Locale;
  includeInternal: boolean;
}

export interface TopicCardsParams extends ScopeParams {
  topicId: string;
}

export interface SearchParams extends ScopeParams {
  /** Trimmed query text. */
  query: string;
  topicId?: string;
  /** `faq` limits results to Q&A answers. */
  category?: 'faq';
  limit: number;
}

export interface QuestionsParams extends ScopeParams {
  topicId?: string;
  limit: number;
}

export interface CardDetailParams {
  cardId: string;
  locale: Locale;
}

export const kbKeys = {
  all: ['kb'] as const,
  me: () => ['kb', 'me'] as const,
  topics: (p: ScopeParams) => ['kb', 'topics', p] as const,
  topicCards: (p: TopicCardsParams) => ['kb', 'topicCards', p] as const,
  search: (p: SearchParams) => ['kb', 'search', p] as const,
  questions: (p: QuestionsParams) => ['kb', 'questions', p] as const,
  card: (p: CardDetailParams) => ['kb', 'card', p] as const,
};
