// Chrome around every signed-in screen: header (title, language, account), section tabs,
// the internal/unreviewed toggle, and the footer count.
import { useMemo } from 'react';
import { Link, Outlet, useLocation, useMatches } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { LocaleSwitcher } from '../components/LocaleSwitcher';
import { useTopics } from '../data/queries';
import { t } from '../i18n';
import { isFaqTopic } from '../lib/api';
import { homePath, type Mode } from '../lib/paths';
import { useLocale, useSwitchLocale } from './locale';
import { usePreferences, useScope } from './preferences';

/** Route `handle` of the Q&A routes; everything else belongs to the knowledge base. */
export interface RouteHandle {
  mode?: Mode;
  /** The section home itself (where the header title keeps the current search). */
  sectionHome?: boolean;
}

/** Which section the current route belongs to, and whether it is that section's home. */
export function useSection(): { mode: Mode; atHome: boolean } {
  const matches = useMatches();
  const handles = matches.map((m) => (m.handle ?? {}) as RouteHandle);
  return {
    mode: handles.some((h) => h.mode === 'faq') ? 'faq' : 'kb',
    atHome: handles.some((h) => h.sectionHome),
  };
}

const EMPTY: never[] = [];

export function AppLayout() {
  const locale = useLocale();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const switchLocale = useSwitchLocale();
  const { includeInternal, setIncludeInternal } = usePreferences();
  const { mode, atHome } = useSection();
  const isFaq = mode === 'faq';

  // Footer count; keeps the previous list while another language / scope loads.
  const topics = useTopics(useScope(), { keepPrevious: true }).data ?? EMPTY;
  const sectionTopicCount = useMemo(
    () => topics.filter((topic) => isFaqTopic(topic.topic_id) === isFaq).length,
    [topics, isFaq],
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-violet-700 text-white shadow">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Back to the section home; on the home itself it keeps the current search. */}
            <Link
              to={atHome ? { pathname: location.pathname, search: location.search } : homePath(locale, mode)}
              className="inline-block text-left"
            >
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t(locale, 'appTitle')}</h1>
              <p className="hidden text-sm text-indigo-100 sm:block">
                {isFaq ? t(locale, 'faqSubtitle') : t(locale, 'appSubtitle')}
              </p>
            </Link>
            <div className="flex items-center gap-3">
              <LocaleSwitcher locale={locale} onChange={switchLocale} />
              <span className="hidden max-w-[12rem] truncate text-sm text-indigo-100 md:inline">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20"
              >
                {t(locale, 'signOut')}
              </button>
            </div>
          </div>

          {/* Section nav: Knowledge base | Q&A */}
          <nav className="mt-4 flex gap-1 rounded-lg bg-white/10 p-1 text-sm font-medium sm:w-fit">
            {(['kb', 'faq'] as Mode[]).map((m) => (
              <Link
                key={m}
                to={homePath(locale, m)}
                aria-current={mode === m ? 'page' : undefined}
                className={`flex-1 rounded-md px-4 py-1.5 text-center transition sm:flex-none ${
                  mode === m ? 'bg-white text-indigo-700 shadow' : 'text-indigo-100 hover:bg-white/10'
                }`}
              >
                {t(locale, m === 'kb' ? 'navKnowledge' : 'navFaq')}
              </Link>
            ))}
          </nav>

          <label className="mt-3 flex items-center gap-2 text-sm text-indigo-100">
            <input
              type="checkbox"
              checked={includeInternal}
              onChange={(e) => setIncludeInternal(e.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-white/10"
            />
            {t(locale, 'showInternal')}
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-500">
        {sectionTopicCount} {t(locale, isFaq ? 'faqTopicsHeading' : 'topicsHeading').toLowerCase()}
      </footer>
    </div>
  );
}
