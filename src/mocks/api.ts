// Mock of the KB API (Supabase Edge Function `kb`) — mock mode only.
//
// Mirrors docs/API-CONTRACT.md and the backend's supabase/functions/kb/index.ts + SQL RPCs:
// routing, 401/404/405 errors, locale resolution with per-row English fallback, the
// public+active scope (internal=1 widens it), ranking/order rules and response envelopes.
// Data comes from the SYNTHETIC fixtures in ./fixtures. Rows are built with the client's
// types from src/lib/api.ts, so a change there that the mock doesn't follow fails `tsc`.
//
// Deliberate differences from the real backend (kept small, listed so nobody trips on them):
//  - GET /topics/:id/cards returns 404 for an unknown topic id (the real API returns 200
//    with an empty list).
//  - /search matches case- and accent-insensitive substrings (every query word must occur
//    in the title, short text, body or keywords) instead of Postgres full-text search, and
//    applies ?category= to any content_category before paging; the real API only honours
//    category=faq and applies it after paging.

import { http, HttpResponse, type JsonBodyType } from 'msw';
import type {
  CardDetail,
  Profile,
  QuestionRow,
  SearchCard,
  Topic,
  TopicCard,
} from '../lib/api';
import { ANON_KEY, KB_BASE, latency } from './config';
import { readAccessToken, type MockIdentity } from './auth';
import { cardById, cards, questions, topicById, topics } from './fixtures';
import type { CardFixture, CardText, Locale, Localized } from './fixtures';

const SUPPORTED_LOCALES: readonly Locale[] = ['ru', 'en', 'es', 'de', 'pt'];
const DEFAULT_LOCALE: Locale = 'ru';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
};

const json = (body: JsonBodyType, status = 200) => HttpResponse.json(body, { status, headers: CORS });

// --- profiles (default locale) ----------------------------------------------------------
// In memory, mirrored to sessionStorage so a page reload in the same tab keeps what
// PUT /me stored (the auth session survives reloads too). A missing row reads as the
// backend's default, like a fresh account.
const PROFILE_STORE_KEY = 'kb.mock.profiles';
const profiles = new Map<string, Locale>(loadProfiles());

function loadProfiles(): [string, Locale][] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(PROFILE_STORE_KEY) ?? '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (e): e is [string, Locale] => Array.isArray(e) && typeof e[0] === 'string' && isLocale(e[1]),
    );
  } catch {
    return [];
  }
}

function saveProfiles(): void {
  try {
    sessionStorage.setItem(PROFILE_STORE_KEY, JSON.stringify([...profiles]));
  } catch {
    /* storage unavailable: memory only */
  }
}

// --- helpers ----------------------------------------------------------------------------
function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value.toLowerCase());
}

/** explicit ?locale= (unknown → en) → stored profile default → ru. */
function resolveLocale(param: string | null, profileLocale: Locale | null): Locale {
  if (param) return isLocale(param) ? (param.toLowerCase() as Locale) : 'en';
  return profileLocale ?? DEFAULT_LOCALE;
}

/** Per-row fallback: the requested locale if this row has it, else English. */
const pick = <T>(value: Localized<T>, locale: Locale): T => value[locale] ?? value.en;

const inScope = (c: { status: string; visibility: string }, includeInternal: boolean) =>
  includeInternal || (c.visibility === 'public' && c.status === 'active');

const isLanding = (c: CardFixture) => c.card_type === 'summary' || c.card_type === 'public_overview';

function clampInt(raw: string | null, def: number, min: number, max: number): number {
  const n = Number.parseInt(raw ?? '', 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

/** Lower-case and strip diacritics: "Cédula" → "cedula", "Führerschein" → "fuhrerschein". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const topicTitle = (topicId: string, locale: Locale) => {
  const t = topicById.get(topicId);
  return t ? pick(t.text, locale).title : null;
};

function cardRow(c: CardFixture, locale: Locale): TopicCard {
  const text: CardText = pick(c.text, locale);
  return {
    card_id: c.card_id,
    card_type: c.card_type,
    status: c.status,
    visibility: c.visibility,
    title: text.title,
    short_body: text.short_body,
    body: text.body,
    confidence: c.confidence,
    staleness_risk: c.staleness_risk,
    needs_review: c.needs_review,
    sensitivity_tags: c.sensitivity_tags,
    quality_score: c.quality_score,
    alignment_score: c.alignment_score,
    last_updated: c.last_updated,
  };
}

/** Topic list order: landing cards first, then editorial boost, then quality, then id. */
function topicCardOrder(a: CardFixture, b: CardFixture): number {
  return (
    Number(isLanding(b)) - Number(isLanding(a)) ||
    b.search_boost - a.search_boost ||
    (b.quality_score ?? -Infinity) - (a.quality_score ?? -Infinity) ||
    a.card_id.localeCompare(b.card_id)
  );
}

// --- route handlers ---------------------------------------------------------------------
function listTopics(locale: Locale, includeInternal: boolean) {
  const counts = new Map<string, number>();
  for (const c of cards) {
    if (inScope(c, includeInternal)) counts.set(c.topic_id, (counts.get(c.topic_id) ?? 0) + 1);
  }
  const rows: Topic[] = topics
    .filter((t) => counts.has(t.topic_id))
    .map((t) => ({
      topic_id: t.topic_id,
      card_count: counts.get(t.topic_id)!,
      clean_message_count: t.clean_message_count,
      sensitivity: t.sensitivity,
      title: pick(t.text, locale).title,
      description: pick(t.text, locale).description,
    }))
    .sort((a, b) => b.card_count! - a.card_count! || (a.title ?? '').localeCompare(b.title ?? ''));
  return json({ locale, include_internal: includeInternal, count: rows.length, topics: rows });
}

function topicCards(topicId: string, locale: Locale, includeInternal: boolean, category: string | null) {
  if (!topicById.has(topicId)) return json({ error: 'not_found', topic_id: topicId }, 404);
  const rows: Array<TopicCard & { content_category: string }> = cards
    .filter((c) => c.topic_id === topicId && inScope(c, includeInternal))
    .filter((c) => !category || c.content_category === category)
    .sort(topicCardOrder)
    .map((c) => ({ ...cardRow(c, locale), content_category: c.content_category }));
  return json({
    locale,
    topic_id: topicId,
    category: category ?? null,
    include_internal: includeInternal,
    count: rows.length,
    cards: rows,
  });
}

function search(url: URL, locale: Locale, includeInternal: boolean) {
  const query = url.searchParams.get('q') ?? '';
  const topicId = url.searchParams.get('topic');
  const category = url.searchParams.get('category');
  const limit = clampInt(url.searchParams.get('limit'), 20, 1, 100);
  const offset = clampInt(url.searchParams.get('offset'), 0, 0, 100000);
  const words = fold(query).split(/\s+/).filter(Boolean);

  const matches: SearchCard[] = [];
  for (const c of cards) {
    if (!inScope(c, includeInternal)) continue;
    if (topicId && c.topic_id !== topicId) continue;
    // category=faq means "under a topic.faq_* topic", exactly as the real API defines it.
    if (category === 'faq' && !c.topic_id.startsWith('topic.faq_')) continue;
    if (category && category !== 'faq' && c.content_category !== category) continue;

    const text = pick(c.text, locale);
    const fields: Array<[string, number]> = [
      [fold(text.title), 3],
      [fold((c.keywords ?? []).map((k) => pick(k, locale)).join(' ')), 2],
      [fold(text.short_body), 1.5],
      [fold(text.body), 1],
    ];
    let rank = 0;
    if (words.length) {
      if (!words.every((w) => fields.some(([field]) => field.includes(w)))) continue;
      const score = words.reduce((sum, w) => sum + fields.reduce((s, [f, wt]) => s + (f.includes(w) ? wt : 0), 0), 0);
      rank = (score / (words.length * 7.5)) * (1 + c.search_boost) * (0.7 + 0.3 * (c.alignment_score ?? 1));
      rank = Math.round(rank * 10000) / 10000;
    }
    matches.push({ ...cardRow(c, locale), topic_id: c.topic_id, topic_title: topicTitle(c.topic_id, locale), rank });
  }

  matches.sort(
    (a, b) =>
      b.rank - a.rank ||
      Number(isLanding(cardById.get(b.card_id)!)) - Number(isLanding(cardById.get(a.card_id)!)) ||
      a.card_id.localeCompare(b.card_id),
  );
  const results = matches.slice(offset, offset + limit);
  return json({
    locale,
    query,
    topic_id: topicId,
    category: category ?? null,
    include_internal: includeInternal,
    limit,
    offset,
    total: matches.length,
    count: results.length,
    results,
  });
}

function listQuestions(url: URL, locale: Locale, includeInternal: boolean) {
  const topicId = url.searchParams.get('topic');
  const limit = clampInt(url.searchParams.get('limit'), 100, 1, 500);
  const rows: QuestionRow[] = questions
    .filter((q) => !topicId || q.topic_id === topicId)
    .filter((q) => includeInternal || (inScope(q, false) && inScope(cardById.get(q.answer_card_id)!, false)))
    .sort((a, b) => b.ask_frequency - a.ask_frequency || a.question_id.localeCompare(b.question_id))
    .slice(0, limit)
    .map((q) => {
      const card = cardById.get(q.answer_card_id)!;
      const answer = pick(card.text, locale);
      return {
        question_id: q.question_id,
        topic_id: q.topic_id,
        ask_frequency: q.ask_frequency,
        question: q.phrasings[locale]?.[0] ?? q.phrasings.en?.[0] ?? answer.title,
        answer_card_id: q.answer_card_id,
        answer_title: answer.title,
        answer_short: answer.short_body,
        answer_body: answer.body,
        topic_title: q.topic_id ? topicTitle(q.topic_id, locale) : null,
      };
    });
  return json({ locale, topic_id: topicId, include_internal: includeInternal, count: rows.length, questions: rows });
}

const STALE_AFTER_DAYS: Record<string, number> = { low: 365, medium: 180, high: 90 };

/** GET /cards/:id — like the real API, NOT scope-filtered. */
function getCard(cardId: string, locale: Locale) {
  const c = cardById.get(cardId);
  if (!c) return json({ error: 'not_found', card_id: cardId }, 404);
  const row = cardRow(c, locale);
  const card: CardDetail & Record<string, unknown> = {
    ...row,
    topic_id: c.topic_id,
    content_category: c.content_category,
    sensitivity_level: c.sensitivity_tags?.length ? 'elevated' : 'normal',
    confidence_score: c.alignment_score,
    last_confirmed_date: c.last_updated?.slice(0, 10) ?? null,
    stale_after_days: STALE_AFTER_DAYS[c.staleness_risk ?? ''] ?? null,
    source_stats: null,
    topic_title: topicTitle(c.topic_id, locale),
    keywords: (c.keywords ?? []).map((k) => pick(k, locale)),
    subtopics: (c.subtopics ?? []).map((s) => pick(s, locale)),
    glossary: (c.glossary ?? []).map((g) => pick(g, locale)),
    entities: (c.entities ?? []).map((e) => ({ name: pick(e.name, locale), type: e.type })),
    resources: (c.resources ?? []).map((r) => ({
      name: pick(r.text, locale).name,
      url: r.url,
      type: r.type,
      description: pick(r.text, locale).description,
    })),
  };
  return json({ locale, card });
}

function version() {
  const translations = cards.reduce((n, c) => n + Object.keys(c.text).length, 0);
  return json({
    version: {
      id: 1,
      version_label: 'mock fixtures (synthetic)',
      source_hash: null,
      topic_count: topics.length,
      card_count: cards.length,
      translation_count: translations,
      notes: 'Synthetic data served by the MSW mock in src/mocks — not the real dataset.',
      deployed_at: '2026-11-15T00:00:00Z',
    },
  });
}

function descriptor() {
  return json({
    name: 'uruguay-knowledge-base-api',
    version: 1,
    mock: true,
    auth: 'anon key (apikey header) + Bearer <user access token> required on all routes except GET /',
    default_locale: DEFAULT_LOCALE,
    supported_locales: SUPPORTED_LOCALES,
    endpoints: {
      me: 'GET /me · PUT /me {default_locale}',
      topics: 'GET /topics?locale&internal',
      topic_cards: 'GET /topics/:topicId/cards?locale&internal&category',
      questions: 'GET /questions?locale&topic&limit&internal  (ranked by ask_frequency; resolves to answer card)',
      search: 'GET /search?q&locale&topic&category&limit&offset&internal',
      card: 'GET /cards/:cardId?locale',
      version: 'GET /version',
    },
  });
}

function authenticate(request: Request): MockIdentity | null {
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token || token === ANON_KEY) return null; // the anon key alone is not a user
  return readAccessToken(token);
}

async function route(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new HttpResponse('ok', { headers: CORS });
  await latency();

  const url = new URL(request.url);
  const segments = url.pathname.slice(new URL(KB_BASE).pathname.length).split('/').filter(Boolean);

  if (segments.length === 0 && request.method === 'GET') return descriptor();

  const user = authenticate(request);
  if (!user) return json({ error: 'unauthorized', message: 'Sign in required.' }, 401);

  const profileLocale = profiles.get(user.userId) ?? null;
  const locale = resolveLocale(url.searchParams.get('locale'), profileLocale);

  if (segments.length === 1 && segments[0] === 'me') {
    if (request.method === 'GET') {
      const me: Profile = { user_id: user.userId, email: user.email, default_locale: profileLocale ?? DEFAULT_LOCALE };
      return json(me);
    }
    if (request.method === 'PUT') {
      let body: { default_locale?: unknown };
      try {
        body = await request.json();
      } catch {
        return json({ error: 'bad_request', message: 'Invalid JSON body.' }, 400);
      }
      const next = typeof body?.default_locale === 'string' ? body.default_locale.toLowerCase() : null;
      if (!isLocale(next)) {
        return json({ error: 'bad_request', message: `default_locale must be one of ${SUPPORTED_LOCALES.join(', ')}.` }, 400);
      }
      profiles.set(user.userId, next);
      saveProfiles();
      const me: Profile = { user_id: user.userId, email: user.email, default_locale: next };
      return json(me);
    }
    return json({ error: 'method_not_allowed' }, 405);
  }

  if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const includeInternal = ['1', 'true', 'yes'].includes((url.searchParams.get('internal') ?? '').toLowerCase());

  if (segments.length === 1 && segments[0] === 'topics') return listTopics(locale, includeInternal);
  if (segments.length === 3 && segments[0] === 'topics' && segments[2] === 'cards') {
    return topicCards(decodeURIComponent(segments[1]), locale, includeInternal, url.searchParams.get('category'));
  }
  if (segments.length === 1 && segments[0] === 'questions') return listQuestions(url, locale, includeInternal);
  if (segments.length === 1 && segments[0] === 'search') return search(url, locale, includeInternal);
  if (segments.length === 2 && segments[0] === 'cards') return getCard(decodeURIComponent(segments[1]), locale);
  if (segments.length === 1 && segments[0] === 'version') return version();

  return json({ error: 'not_found', path: url.pathname }, 404);
}

export const apiHandlers = [
  http.all(KB_BASE, ({ request }) => route(request)),
  http.all(`${KB_BASE}/*`, ({ request }) => route(request)),
];
