import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '../test/api-url';
import { recordApiRequests } from '../test/requests';
import { server } from '../test/server';
import { signInDirect } from '../test/session';
import {
  ApiError,
  getCard,
  getMe,
  getTopicCards,
  isFaqTopic,
  listQuestions,
  listTopics,
  searchCards,
  setDefaultLocale,
} from './api';
import { authClient } from './auth';

describe('without a session', () => {
  it('sends the anon key, and the API answers 401 as an ApiError', async () => {
    await authClient.signOut();
    let headers: Headers | undefined;
    server.use(
      http.get(api('/topics'), ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({ error: 'unauthorized', message: 'Sign in required.' }, { status: 401 });
      }),
    );
    const error = await listTopics('ru').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect((error as ApiError).message).toBe('API 401: Sign in required.');
    expect(headers?.get('authorization')).toBe(`Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
  });
});

describe('signed in', () => {
  beforeEach(async () => {
    await signInDirect();
  });

  it("sends the user's access token and the apikey header", async () => {
    const session = (await authClient.getSession()).data.session!;
    let headers: Headers | undefined;
    server.use(
      http.get(api('/me'), ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({ user_id: 'u', email: null, default_locale: 'ru' });
      }),
    );
    await getMe();
    expect(headers?.get('authorization')).toBe(`Bearer ${session.access_token}`);
    expect(headers?.get('apikey')).toBe(import.meta.env.VITE_SUPABASE_ANON_KEY);
  });

  it('builds query strings: internal=1 only when asked, empty values dropped', async () => {
    const requests = recordApiRequests();
    await listTopics('en');
    await listTopics('en', true);
    await getTopicCards('topic.renting', 'de', true);
    await listQuestions({ locale: 'es', topicId: 'topic.faq_daily_life', limit: 5 });
    await searchCards({ query: 'cédula', locale: 'ru', topicId: null, category: null, includeInternal: false });

    expect(requests).toEqual([
      { method: 'GET', path: '/topics', params: { locale: 'en' } },
      { method: 'GET', path: '/topics', params: { locale: 'en', internal: '1' } },
      { method: 'GET', path: '/topics/topic.renting/cards', params: { locale: 'de', internal: '1' } },
      { method: 'GET', path: '/questions', params: { locale: 'es', topic: 'topic.faq_daily_life', limit: '5' } },
      { method: 'GET', path: '/search', params: { q: 'cédula', locale: 'ru', limit: '20', offset: '0' } },
    ]);
  });

  it('unwraps response envelopes', async () => {
    const topics = await listTopics('en');
    expect(topics.map((t) => t.topic_id)).toContain('topic.renting');

    const cards = await getTopicCards('topic.renting', 'en');
    expect(cards[0].card_id).toBe('card.renting.overview.main');

    const card = await getCard('card.renting.instruction.guarantee_options', 'en');
    expect(card.glossary[0].term).toBe('Rental guarantee (garantía)');

    const questions = await listQuestions({ locale: 'en', limit: 1 });
    expect(questions).toHaveLength(1);

    const result = await searchCards({ query: 'deposit', locale: 'en' });
    expect(result.total).toBe(result.cards.length);
    expect(result.cards.length).toBeGreaterThan(0);
  });

  it('category=faq also filters client-side to topic.faq_* cards', async () => {
    // Simulate the older Edge Function that ignores ?category=.
    server.use(
      http.get(api('/search'), () =>
        HttpResponse.json({
          results: [
            { card_id: 'card.a', topic_id: 'topic.faq_x' },
            { card_id: 'card.b', topic_id: 'topic.renting' },
          ],
          total: 2,
        }),
      ),
    );
    const faq = await searchCards({ query: 'x', locale: 'en', category: 'faq' });
    expect(faq.cards.map((c) => c.card_id)).toEqual(['card.a']);
    expect(faq.total).toBe(1);

    const all = await searchCards({ query: 'x', locale: 'en' });
    expect(all.total).toBe(2);
  });

  it('turns error responses into ApiError with the server message', async () => {
    server.use(
      http.get(api('/topics'), () => HttpResponse.json({ error: 'x', message: 'exploded' }, { status: 500 })),
      http.get(api('/questions'), () => new HttpResponse('not json', { status: 502 })),
    );
    await expect(listTopics('en')).rejects.toMatchObject({ name: 'ApiError', status: 500, message: 'API 500: exploded' });
    await expect(listQuestions({ locale: 'en' })).rejects.toMatchObject({ status: 502, message: 'API 502' });
    await expect(getCard('card.nope.x.y', 'en')).rejects.toMatchObject({ status: 404 });
  });

  it('aborts requests through the AbortSignal', async () => {
    let serverSawAbort = false;
    server.use(
      http.get(api('/topics'), async ({ request }) => {
        await new Promise<void>((resolve) => request.signal.addEventListener('abort', () => resolve()));
        serverSawAbort = true;
        return HttpResponse.json({ topics: [] });
      }),
    );
    const controller = new AbortController();
    const pending = listTopics('en', false, controller.signal);
    await new Promise((r) => setTimeout(r, 20));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await new Promise((r) => setTimeout(r, 0));
    expect(serverSawAbort).toBe(true);
  });

  it('PUT /me saves the default locale', async () => {
    const profile = await setDefaultLocale('de');
    expect(profile.default_locale).toBe('de');
    expect((await getMe()).default_locale).toBe('de');
  });
});

describe('isFaqTopic', () => {
  it.each([
    ['topic.faq_residency', true],
    ['topic.renting', false],
    ['topic.faqx', false],
    [null, false],
    [undefined, false],
    ['', false],
  ])('%s → %s', (id, expected) => {
    expect(isFaqTopic(id)).toBe(expected);
  });
});
