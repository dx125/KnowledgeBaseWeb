// Read fixture text the same way the mock API resolves it (requested locale, else English),
// so tests don't hard-code content strings.
import { cardById, questions, topicById } from '../mocks/fixtures';
import type { Locale } from '../mocks/fixtures';

export function topicTitle(topicId: string, locale: Locale = 'ru'): string {
  const t = topicById.get(topicId);
  if (!t) throw new Error(`no fixture topic ${topicId}`);
  return (t.text[locale] ?? t.text.en).title;
}

export function topicDescription(topicId: string, locale: Locale = 'ru'): string {
  const t = topicById.get(topicId)!;
  return (t.text[locale] ?? t.text.en).description;
}

export function cardText(cardId: string, locale: Locale = 'ru') {
  const c = cardById.get(cardId);
  if (!c) throw new Error(`no fixture card ${cardId}`);
  return c.text[locale] ?? c.text.en;
}

export function questionText(questionId: string, locale: Locale = 'ru'): string {
  const q = questions.find((x) => x.question_id === questionId);
  if (!q) throw new Error(`no fixture question ${questionId}`);
  return q.phrasings[locale]?.[0] ?? q.phrasings.en?.[0] ?? cardText(q.answer_card_id, locale).title;
}
