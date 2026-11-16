// URL scheme of the app — the only place paths are built or parsed.
//
//   /                                  → redirect to /{lang}
//   /:lang                ?q=          knowledge-base home (search results while q is set)
//   /:lang/topics/:slug   ?q=          knowledge-base topic (search within it while q is set)
//   /:lang/faq            ?q=          Q&A home
//   /:lang/faq/topics/:slug ?q=        Q&A topic
//
// `lang` is one of the UI locales. Topic slugs carry no language, so a link works in every
// locale: `topic.residency` ↔ `residency`. Paths are relative to the origin (no host).
import { SUPPORTED_LOCALES, type Locale } from '../i18n';
import { isFaqTopic } from './api';

export type Mode = 'kb' | 'faq';

const SLUG = /^[a-z0-9_]+$/;

/** `topic.residency` → `residency`. */
export function topicSlug(topicId: string): string {
  return topicId.replace(/^topic\./, '');
}

/** `residency` → `topic.residency`; null for anything that is not a valid slug. Never throws. */
export function topicIdFromSlug(slug: string | undefined): string | null {
  return slug && SLUG.test(slug) ? `topic.${slug}` : null;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function withQuery(path: string, q?: string): string {
  return q ? `${path}?${new URLSearchParams({ q })}` : path;
}

/** Home of a section: `/ru` or `/ru/faq`, optionally with a search query. */
export function homePath(lang: Locale, mode: Mode = 'kb', q?: string): string {
  return withQuery(mode === 'faq' ? `/${lang}/faq` : `/${lang}`, q);
}

/** A topic's page; Q&A topics live under /faq. */
export function topicPath(lang: Locale, topicId: string, q?: string): string {
  const section = isFaqTopic(topicId) ? `/${lang}/faq/topics` : `/${lang}/topics`;
  return withQuery(`${section}/${topicSlug(topicId)}`, q);
}

/** Split `/ru/topics/x` into its language prefix (if valid) and the rest (`/topics/x`). */
export function splitLang(pathname: string): { lang: Locale | null; rest: string } {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  if (match && isLocale(match[1])) return { lang: match[1], rest: match[2] ?? '' };
  return { lang: null, rest: pathname === '/' ? '' : pathname };
}

/**
 * The same location in another language: swaps the prefix, keeps path, query and hash.
 * A path without a valid prefix gets one.
 */
export function swapLang(location: { pathname: string; search?: string; hash?: string }, lang: Locale): string {
  const { rest } = splitLang(location.pathname);
  return `/${lang}${rest}${location.search ?? ''}${location.hash ?? ''}`;
}
