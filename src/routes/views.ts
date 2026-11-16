// Shape API rows for the card / Q&A components.
import type { CardView } from '../components/CardItem';
import type { FaqView } from '../components/FaqItem';
import type { QuestionRow, SearchCard, TopicCard } from '../lib/api';

/** A search hit, labelled with its topic. */
export const searchCardView = (c: SearchCard): CardView => ({ ...c });

/** A card shown inside its own topic: no topic label. */
export const topicCardView = (c: TopicCard | SearchCard): CardView => ({ ...c, topic_title: null });

/** A Q&A answer card as question → answer (the card title is the question). */
export const faqCardView = (c: TopicCard | SearchCard, withTopic: boolean): FaqView => ({
  card_id: c.card_id,
  title: c.title,
  short_body: c.short_body,
  body: c.body,
  needs_review: c.needs_review,
  topic_title: withTopic && 'topic_title' in c ? c.topic_title : null,
});

/** A ranked question resolves to its answer card; render question → answer. */
export const questionView = (q: QuestionRow): FaqView => ({
  card_id: q.answer_card_id,
  title: q.question,
  short_body: q.answer_short,
  body: q.answer_body,
  needs_review: true,
  topic_title: q.topic_title,
});
