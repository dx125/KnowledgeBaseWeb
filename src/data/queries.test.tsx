import { act, renderHook, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError, type Profile } from '../lib/api';
import { api } from '../test/api-url';
import { recordApiRequests } from '../test/requests';
import { server } from '../test/server';
import { createTestQueryClient, signInDirect, withQueryClient } from '../test/session';
import { kbKeys } from './keys';
import {
  errorMessage,
  useCardDetail,
  useProfile,
  useQuestions,
  useSaveDefaultLocale,
  useSearch,
  useTopicCards,
  useTopics,
} from './queries';
import { createQueryClient, shouldRetry, STALE_TIME_MS } from './queryClient';

beforeEach(async () => {
  await signInDirect();
});

function setup() {
  const client = createTestQueryClient();
  return { client, wrapper: withQueryClient(client) };
}

describe('search races and cancellation', () => {
  it('shows the newest query even if an older response arrives later, and cancels the older request', async () => {
    const aborted: string[] = [];
    server.use(
      http.get(api('/search'), async ({ request }) => {
        const q = new URL(request.url).searchParams.get('q')!;
        request.signal.addEventListener('abort', () => aborted.push(q));
        await delay(q === 'slow' ? 150 : 5);
        return HttpResponse.json({ results: [{ card_id: `card.${q}`, topic_id: 'topic.x' }], total: 1 });
      }),
    );
    const { wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ query }) => useSearch({ query, locale: 'en', includeInternal: false, limit: 20 }),
      { wrapper, initialProps: { query: 'slow' } },
    );
    await delay(20); // the 'slow' request is in flight
    rerender({ query: 'fast' });

    await waitFor(() => expect(result.current.data?.cards[0].card_id).toBe('card.fast'));
    await delay(200); // 'slow' would have answered by now
    expect(result.current.data?.cards[0].card_id).toBe('card.fast');
    expect(aborted).toEqual(['slow']);
  });

  it('cancels an in-flight request when its screen unmounts', async () => {
    let aborted = false;
    server.use(
      http.get(api('/topics/:id/cards'), async ({ request }) => {
        request.signal.addEventListener('abort', () => (aborted = true));
        await delay(200);
        return HttpResponse.json({ cards: [] });
      }),
    );
    const { wrapper } = setup();
    const { unmount } = renderHook(
      () => useTopicCards({ topicId: 'topic.renting', locale: 'en', includeInternal: false }),
      { wrapper },
    );
    await delay(20);
    unmount();
    await waitFor(() => expect(aborted).toBe(true));
  });

  it('does not search for an empty query', async () => {
    const requests = recordApiRequests();
    const { wrapper } = setup();
    const { result } = renderHook(() => useSearch({ query: '', locale: 'en', includeInternal: false, limit: 20 }), {
      wrapper,
    });
    await delay(20);
    expect(result.current.fetchStatus).toBe('idle');
    expect(requests).toEqual([]);
  });
});

describe('caching', () => {
  it('serves a repeated query from the cache without a new request', async () => {
    const requests = recordApiRequests();
    const { wrapper } = setup();
    const params = { locale: 'en' as const, includeInternal: false };

    const first = renderHook(() => useTopics(params), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const second = renderHook(() => useTopics(params), { wrapper });
    expect(second.result.current.data).toEqual(first.result.current.data); // on the first render
    await delay(20);
    expect(requests.filter((r) => r.path === '/topics')).toHaveLength(1);
  });

  it('caches each locale and scope separately', async () => {
    const requests = recordApiRequests();
    const { client, wrapper } = setup();
    const { result, rerender } = renderHook(
      (p: { locale: 'en' | 'ru'; includeInternal: boolean }) => useTopics(p),
      { wrapper, initialProps: { locale: 'en', includeInternal: false } },
    );
    for (const next of [
      { locale: 'ru', includeInternal: false },
      { locale: 'ru', includeInternal: true },
      { locale: 'en', includeInternal: false }, // cached: no request
    ] as const) {
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      rerender(next);
    }
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requests.map((r) => r.params)).toEqual([
      { locale: 'en' },
      { locale: 'ru' },
      { locale: 'ru', internal: '1' },
    ]);
    const internal = client.getQueryData<{ topic_id: string }[]>(kbKeys.topics({ locale: 'ru', includeInternal: true }));
    const publicOnly = client.getQueryData<{ topic_id: string }[]>(kbKeys.topics({ locale: 'ru', includeInternal: false }));
    expect(internal?.map((t) => t.topic_id)).toContain('topic.pets');
    expect(publicOnly?.map((t) => t.topic_id)).not.toContain('topic.pets');
  });

  it('keepPrevious shows the last list while another locale loads', async () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ locale }: { locale: 'en' | 'de' }) => useTopics({ locale, includeInternal: false }, { keepPrevious: true }),
      { wrapper, initialProps: { locale: 'en' } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const english = result.current.data;
    rerender({ locale: 'de' });
    expect(result.current.data).toBe(english);
    expect(result.current.isPlaceholderData).toBe(true);
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data).not.toBe(english);
  });

  it('questions and card detail are keyed by their parameters too', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => ({
        top: useQuestions({ locale: 'en', includeInternal: false, limit: 3 }),
        card: useCardDetail({ cardId: 'card.renting.instruction.guarantee_options', locale: 'en' }),
        idle: useCardDetail({ cardId: 'card.renting.advice.12', locale: 'en' }, { enabled: false }),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.top.isSuccess && result.current.card.isSuccess).toBe(true));
    expect(result.current.top.data).toHaveLength(3);
    expect(result.current.card.data?.card_id).toBe('card.renting.instruction.guarantee_options');
    expect(result.current.idle.fetchStatus).toBe('idle');
  });
});

describe('profile and default locale', () => {
  it('save(locale) updates the cached profile synchronously, then PUTs it', async () => {
    const requests = recordApiRequests();
    const { client, wrapper } = setup();
    const { result } = renderHook(() => ({ profile: useProfile({ enabled: true }), save: useSaveDefaultLocale() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.profile.data?.default_locale).toBe('ru'));

    act(() => result.current.save('de'));
    // Synchronous: any render from now on reads 'de' (components are notified a tick later).
    expect(client.getQueryData<Profile>(kbKeys.me())?.default_locale).toBe('de');
    await waitFor(() => expect(result.current.profile.data?.default_locale).toBe('de'));
    await waitFor(() => expect(requests.some((r) => r.method === 'PUT' && r.path === '/me')).toBe(true));
  });

  it('an older save answering last does not undo a newer choice', async () => {
    server.use(
      http.put(api('/me'), async ({ request }) => {
        const { default_locale } = (await request.json()) as { default_locale: string };
        await delay(default_locale === 'en' ? 100 : 5);
        return HttpResponse.json({ user_id: 'u', email: null, default_locale });
      }),
    );
    const { client, wrapper } = setup();
    const { result } = renderHook(() => ({ profile: useProfile({ enabled: true }), save: useSaveDefaultLocale() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.profile.isSuccess).toBe(true));
    act(() => result.current.save('en'));
    act(() => result.current.save('de'));
    await delay(150);
    expect(client.getQueryData<Profile>(kbKeys.me())?.default_locale).toBe('de');
  });

  it('a failed save keeps the chosen locale', async () => {
    server.use(http.put(api('/me'), () => HttpResponse.json({ message: 'nope' }, { status: 500 })));
    const { client, wrapper } = setup();
    const { result } = renderHook(() => ({ profile: useProfile({ enabled: true }), save: useSaveDefaultLocale() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.profile.isSuccess).toBe(true));
    act(() => result.current.save('es'));
    await delay(20);
    expect(client.getQueryData<Profile>(kbKeys.me())?.default_locale).toBe('es');
  });

  it('the profile is not fetched while disabled (signed out)', async () => {
    const requests = recordApiRequests();
    const { wrapper } = setup();
    renderHook(() => useProfile({ enabled: false }), { wrapper });
    await delay(20);
    expect(requests).toEqual([]);
  });
});

describe('query client defaults', () => {
  it('retries network errors and 5xx once, 4xx never', () => {
    expect(shouldRetry(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetry(1, new TypeError('Failed to fetch'))).toBe(false);
    expect(shouldRetry(0, new ApiError(503))).toBe(true);
    expect(shouldRetry(1, new ApiError(503))).toBe(false);
    for (const status of [400, 401, 403, 404]) expect(shouldRetry(0, new ApiError(status))).toBe(false);
  });

  it('keeps data fresh for 5 minutes and does not refetch on window focus', () => {
    const queries = createQueryClient().getDefaultOptions().queries!;
    expect(queries.staleTime).toBe(STALE_TIME_MS);
    expect(STALE_TIME_MS).toBe(300_000);
    expect(queries.refetchOnWindowFocus).toBe(false);
  });

  it('errorMessage keeps the text the UI has always shown', () => {
    expect(errorMessage(new ApiError(500, 'boom'))).toBe('API 500: boom');
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe('Failed to fetch');
    expect(errorMessage('plain')).toBe('plain');
  });
});
