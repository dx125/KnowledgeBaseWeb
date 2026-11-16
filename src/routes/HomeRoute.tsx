// Section home: the topic grid (Q&A adds "most asked"), or search results while ?q= is set.
import { useMemo } from 'react';
import { useSection } from '../app/AppLayout';
import { useLocale } from '../app/locale';
import { useScope } from '../app/preferences';
import { CardItem } from '../components/CardItem';
import { FaqItem } from '../components/FaqItem';
import { EmptyState, ErrorBox, Spinner } from '../components/Feedback';
import { SearchBar } from '../components/SearchBar';
import { TopicGrid } from '../components/TopicGrid';
import { errorMessage, useQuestions, useSearch, useTopics } from '../data/queries';
import { t } from '../i18n';
import { isFaqTopic } from '../lib/api';
import { useSearchQuery } from './useSearchQuery';
import { faqCardView, questionView, searchCardView } from './views';

const EMPTY: never[] = [];

export function HomeRoute() {
  const { mode } = useSection();
  const locale = useLocale();
  const scope = useScope();
  const isFaq = mode === 'faq';
  const [q, setQ] = useSearchQuery();
  const query = q.trim();
  const searching = query.length > 0;

  const topicsQuery = useTopics(scope);
  // Knowledge-base topics and Q&A topics share the topics table; split by id prefix.
  const topics = topicsQuery.data ?? EMPTY;
  const shownTopics = useMemo(() => topics.filter((topic) => isFaqTopic(topic.topic_id) === isFaq), [topics, isFaq]);

  const search = useSearch({ ...scope, query, category: isFaq ? 'faq' : undefined, limit: 50 });
  const results = search.data?.cards ?? EMPTY;

  // Q&A home: most asked questions (failures just leave the section out).
  const mostAsked = useQuestions({ ...scope, limit: 20 }, { enabled: isFaq }).data ?? EMPTY;

  const error = searching ? search.error : topicsQuery.error;

  return (
    <section>
      <div className="mx-auto mb-8 max-w-2xl">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder={t(locale, isFaq ? 'searchFaqPlaceholder' : 'searchPlaceholder')}
          autoFocus
        />
      </div>

      {error && <ErrorBox locale={locale} message={errorMessage(error)} />}

      {searching ? (
        search.isPending ? (
          <Spinner label={t(locale, 'searching')} />
        ) : results.length === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <>
            {/* A heading (styled like text): the results list sits between the page title and the card titles. */}
            <h2 className="mb-3 text-sm text-slate-500">
              {results.length} {t(locale, 'results')}
            </h2>
            {isFaq ? (
              <div className="grid gap-2.5">
                {results.map((c) => (
                  <FaqItem key={c.card_id} card={faqCardView(c, true)} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((c) => (
                  <CardItem key={c.card_id} card={searchCardView(c)} locale={locale} />
                ))}
              </div>
            )}
          </>
        )
      ) : (
        <>
          {isFaq && mostAsked.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-slate-700">{t(locale, 'mostAsked')}</h2>
              <div className="grid gap-2.5">
                {mostAsked.map((question) => (
                  <FaqItem key={question.question_id} card={questionView(question)} locale={locale} />
                ))}
              </div>
            </section>
          )}
          <h2 className="mb-4 text-lg font-semibold text-slate-700">
            {t(locale, isFaq ? 'browseByTopic' : 'topicsHeading')}
          </h2>
          {topicsQuery.isPending ? (
            <Spinner label={t(locale, 'loading')} />
          ) : (
            <TopicGrid topics={shownTopics} locale={locale} countKey={isFaq ? 'questions' : 'cards'} />
          )}
        </>
      )}
    </section>
  );
}
