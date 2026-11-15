// SYNTHETIC FIXTURE DATA for the offline mock backend — see the header of each file.
// Entry point: exports the rows and checks the invariants the real API relies on, so a
// hand edit that breaks them fails loudly when mock mode starts.

import { kbCards } from './cards';
import { faqCards, questions } from './faq';
import { topics } from './topics';
import type { CardFixture } from './types';

export type * from './types';
export { questions, topics };

export const cards: CardFixture[] = [...kbCards, ...faqCards];

export const topicById = new Map(topics.map((t) => [t.topic_id, t]));
export const cardById = new Map(cards.map((c) => [c.card_id, c]));

const TOPIC_ID = /^topic\.[a-z0-9_]+$/;
const CARD_ID = /^card\.([a-z0-9_]+)\.[a-z0-9_]+\.[a-z0-9_]+$/; // card.<topic>.<kind>.<slug>
const QUESTION_ID = /^q\.(faq_[a-z0-9_]+)\.q\d{2}_[a-z0-9_]+$/; // q.<faq topic>.<qNN_slug>

function checkFixtures(): void {
  const problems: string[] = [];
  const unique = (ids: string[], kind: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`duplicate ${kind} id ${id}`);
      seen.add(id);
    }
  };
  unique(topics.map((t) => t.topic_id), 'topic');
  unique(cards.map((c) => c.card_id), 'card');
  unique(questions.map((q) => q.question_id), 'question');

  for (const t of topics) {
    if (!TOPIC_ID.test(t.topic_id)) problems.push(`bad topic id ${t.topic_id}`);
  }
  for (const c of cards) {
    const m = CARD_ID.exec(c.card_id);
    if (!m) problems.push(`bad card id ${c.card_id}`);
    else if (`topic.${m[1]}` !== c.topic_id) problems.push(`${c.card_id}: id does not match ${c.topic_id}`);
    if (!topicById.has(c.topic_id)) problems.push(`${c.card_id}: unknown topic ${c.topic_id}`);
    const faqTopic = c.topic_id.startsWith('topic.faq_');
    if (faqTopic !== (c.content_category === 'faq')) {
      problems.push(`${c.card_id}: FAQ cards live exactly under topic.faq_* with content_category "faq"`);
    }
  }
  for (const q of questions) {
    const m = QUESTION_ID.exec(q.question_id);
    if (!m) problems.push(`bad question id ${q.question_id}`);
    else if (q.topic_id !== `topic.${m[1]}`) problems.push(`${q.question_id}: id does not match ${q.topic_id}`);
    const answer = cardById.get(q.answer_card_id);
    if (!answer) problems.push(`${q.question_id}: unknown answer card ${q.answer_card_id}`);
    else if (answer.topic_id !== q.topic_id) problems.push(`${q.question_id}: answer card is in another topic`);
  }

  if (problems.length) throw new Error(`[mock fixtures] ${problems.length} problem(s):\n${problems.join('\n')}`);
}

checkFixtures();
