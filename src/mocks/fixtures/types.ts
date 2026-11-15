// Shapes of the SYNTHETIC fixture rows behind the mock API (src/mocks/api.ts).
//
// Field types are taken from the client's own API types (src/lib/api.ts) wherever the
// API exposes the field, so a change there breaks `tsc` here instead of silently drifting.

import type {
  CardStatus,
  CardType,
  EntityRef,
  ResourceRef,
  Topic,
  TopicCard,
  Visibility,
} from '../../lib/api';

/** Locales the backend supports (its SUPPORTED_LOCALES). */
export type Locale = 'ru' | 'en' | 'es' | 'de' | 'pt';

/** Localized value. `en` is required: the API falls back to it per row. */
export type Localized<T> = { en: T } & Partial<Record<Exclude<Locale, 'en'>, T>>;

/** Editorial category (cards.content_category); `faq` = answers under topic.faq_*. */
export type ContentCategory =
  | 'overview'
  | 'checklist'
  | 'instruction'
  | 'advice'
  | 'warning'
  | 'reference'
  | 'community_experience'
  | 'resource_list'
  | 'faq';

export interface TopicFixture {
  topic_id: string; // topic.<slug>
  clean_message_count: Topic['clean_message_count'];
  sensitivity: Topic['sensitivity'];
  text: Localized<{ title: string; description: string }>;
}

export interface CardText {
  title: string;
  short_body: string;
  body: string;
}

export interface EntityFixture {
  type: EntityRef['type'];
  name: Localized<string>;
}

export interface ResourceFixture {
  url: ResourceRef['url'];
  type: ResourceRef['type'];
  text: Localized<{ name: string; description: string | null }>;
}

export interface CardFixture {
  card_id: string; // card.<topic>.<kind>.<slug>
  topic_id: string;
  card_type: CardType;
  content_category: ContentCategory;
  status: CardStatus;
  visibility: Visibility;
  confidence: TopicCard['confidence'];
  staleness_risk: TopicCard['staleness_risk'];
  needs_review: TopicCard['needs_review'];
  sensitivity_tags: TopicCard['sensitivity_tags'];
  quality_score: TopicCard['quality_score'];
  alignment_score: TopicCard['alignment_score'];
  search_boost: number;
  last_updated: TopicCard['last_updated'];
  text: Localized<CardText>;
  keywords?: Localized<string>[];
  subtopics?: Localized<string>[];
  glossary?: Localized<{ term: string; definition: string }>[];
  entities?: EntityFixture[];
  resources?: ResourceFixture[];
}

export interface QuestionFixture {
  question_id: string; // q.<faq topic>.<qNN_slug>
  topic_id: string | null;
  answer_card_id: string;
  ask_frequency: number;
  status: CardStatus;
  visibility: Visibility;
  /** Localized phrasings; [0] is the primary one the API returns. */
  phrasings: Partial<Record<Locale, string[]>>;
}
