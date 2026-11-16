// react-query bindings for the KB API (src/lib/api.ts).
//
// `*Query(params)` return shareable query options (key + fetcher). They can be used with
// useQuery, prefetchQuery or route loaders. The `use*` hooks are what components call.
// Every fetcher forwards react-query's AbortSignal, so a request whose result is no
// longer wanted (the key changed, the screen unmounted) is cancelled, and a late
// response can never overwrite newer data.
import { useCallback } from 'react';
import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Locale } from '../i18n';
import {
  getCard,
  getMe,
  getTopicCards,
  listQuestions,
  listTopics,
  searchCards,
  setDefaultLocale,
  type Profile,
} from '../lib/api';
import {
  kbKeys,
  type CardDetailParams,
  type QuestionsParams,
  type ScopeParams,
  type SearchParams,
  type TopicCardsParams,
} from './keys';

// --- query options ------------------------------------------------------------------------
export const meQuery = () =>
  queryOptions({
    queryKey: kbKeys.me(),
    queryFn: ({ signal }) => getMe(signal),
  });

export const topicsQuery = (p: ScopeParams) =>
  queryOptions({
    queryKey: kbKeys.topics(p),
    queryFn: ({ signal }) => listTopics(p.locale, p.includeInternal, signal),
  });

export const topicCardsQuery = (p: TopicCardsParams) =>
  queryOptions({
    queryKey: kbKeys.topicCards(p),
    queryFn: ({ signal }) => getTopicCards(p.topicId, p.locale, p.includeInternal, signal),
  });

export const searchQuery = (p: SearchParams) =>
  queryOptions({
    queryKey: kbKeys.search(p),
    queryFn: ({ signal }) =>
      searchCards({
        query: p.query,
        locale: p.locale,
        topicId: p.topicId,
        category: p.category,
        limit: p.limit,
        includeInternal: p.includeInternal,
        signal,
      }),
  });

export const questionsQuery = (p: QuestionsParams) =>
  queryOptions({
    queryKey: kbKeys.questions(p),
    queryFn: ({ signal }) =>
      listQuestions({
        locale: p.locale,
        topicId: p.topicId,
        limit: p.limit,
        includeInternal: p.includeInternal,
        signal,
      }),
  });

export const cardDetailQuery = (p: CardDetailParams) =>
  queryOptions({
    queryKey: kbKeys.card(p),
    queryFn: ({ signal }) => getCard(p.cardId, p.locale, signal),
  });

// --- hooks --------------------------------------------------------------------------------
/** The signed-in user's profile (stored default locale). */
export function useProfile({ enabled }: { enabled: boolean }) {
  return useQuery({ ...meQuery(), enabled });
}

/**
 * All topics (knowledge-base and Q&A) for a locale / scope.
 * `keepPrevious` keeps showing the last list while another locale / scope loads — for
 * places that need a topic's title to stay on screen meanwhile.
 */
export function useTopics(p: ScopeParams, { enabled = true, keepPrevious = false } = {}) {
  return useQuery({ ...topicsQuery(p), enabled, placeholderData: keepPrevious ? keepPreviousData : undefined });
}

export function useTopicCards(p: TopicCardsParams, { enabled = true } = {}) {
  return useQuery({ ...topicCardsQuery(p), enabled });
}

/** Full-text search; idle (no request) while the query text is empty. */
export function useSearch(p: SearchParams, { enabled = true } = {}) {
  return useQuery({ ...searchQuery(p), enabled: enabled && p.query !== '' });
}

/** Q&A questions ranked by how often they are asked. */
export function useQuestions(p: QuestionsParams, { enabled = true } = {}) {
  return useQuery({ ...questionsQuery(p), enabled });
}

/** Related context of one card (glossary, entities, resources). */
export function useCardDetail(p: CardDetailParams, { enabled = true } = {}) {
  return useQuery({ ...cardDetailQuery(p), enabled });
}

/**
 * Save the user's default locale. Returns `save(locale)`.
 *
 * The cached profile is updated synchronously, before the request, because the UI
 * language follows the profile: it must already read the new value on the next render.
 * The server's reply is not written back (with quick successive switches an older reply
 * could land last and undo the newer choice). A failed save keeps the new language for
 * this session, as before.
 */
export function useSaveDefaultLocale() {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({ mutationFn: (locale: Locale) => setDefaultLocale(locale) });
  return useCallback(
    (locale: Locale) => {
      const profile = queryClient.getQueryData<Profile>(kbKeys.me());
      if (profile) {
        void queryClient.cancelQueries({ queryKey: kbKeys.me() }); // a refetch in flight must not land afterwards
        queryClient.setQueryData<Profile>(kbKeys.me(), { ...profile, default_locale: locale });
      }
      mutate(locale);
    },
    [queryClient, mutate],
  );
}

/** Error text as the UI has always shown it (`API 500: …`, network errors verbatim). */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
