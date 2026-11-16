// One topic: its cards (knowledge base) or ranked questions (Q&A), or search within it.
import { useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { useSection } from '../app/AppLayout';
import { useLocale } from '../app/locale';
import { useScope } from '../app/preferences';
import { CardItem } from '../components/CardItem';
import { FaqItem } from '../components/FaqItem';
import { EmptyState, ErrorBox, Spinner } from '../components/Feedback';
import { SearchBar } from '../components/SearchBar';
import { kbKeys, type ScopeParams } from '../data/keys';
import { errorMessage, useQuestions, useSearch, useTopicCards, useTopics } from '../data/queries';
import { t } from '../i18n';
import { isFaqTopic, type Topic } from '../lib/api';
import { homePath, topicIdFromSlug, topicPath } from '../lib/paths';
import { NotFound } from './NotFoundRoute';
import { useSearchQuery } from './useSearchQuery';
import { faqCardView, questionView, topicCardView } from './views';

const EMPTY: never[] = [];

/**
 * The topic's title and description, from the topics list of the current scope (kept on
 * screen while another language / scope loads). If the current scope no longer lists it
 * (e.g. the internal toggle was switched off while viewing an internal-only topic), fall
 * back to a cached list in the same language, so the page stays as it was.
 */
function useTopic(topicId: string | null, scope: ScopeParams) {
  const queryClient = useQueryClient();
  const topics = useTopics(scope, { keepPrevious: true });
  let topic: Topic | undefined = topics.data?.find((x) => x.topic_id === topicId);
  if (!topic && topics.isSuccess && !topics.isPlaceholderData) {
    for (const [key, list] of queryClient.getQueriesData<Topic[]>({ queryKey: [...kbKeys.all, 'topics'] })) {
      if ((key[2] as ScopeParams | undefined)?.locale !== scope.locale) continue;
      topic = list?.find((x) => x.topic_id === topicId);
      if (topic) break;
    }
  }
  return { topic, pending: topics.isPending, error: topics.error };
}

export function TopicRoute() {
  const { mode } = useSection();
  const locale = useLocale();
  const scope = useScope();
  const location = useLocation();
  const { topicSlug } = useParams();
  const topicId = topicIdFromSlug(topicSlug);
  const isFaq = mode === 'faq';
  const [q, setQ] = useSearchQuery();
  const query = q.trim();
  const id = topicId ?? '';
  const valid = !!topicId && isFaqTopic(topicId) === isFaq;

  const { topic, pending: topicPending, error: topicError } = useTopic(topicId, scope);

  // Browse: cards (knowledge base) or questions ranked by frequency (Q&A); else search.
  const search = useSearch(
    { ...scope, query, topicId: id, category: isFaq ? 'faq' : undefined, limit: 100 },
    { enabled: valid },
  );
  const cards = useTopicCards({ ...scope, topicId: id }, { enabled: valid && !isFaq && !query });
  const questions = useQuestions({ ...scope, topicId: id, limit: 200 }, { enabled: valid && isFaq && !query });
  const list = query ? search : isFaq ? questions : cards;

  if (!topicId) return <NotFound mode={mode} />;
  // A Q&A topic under /topics (or the reverse): send it to its section.
  if (!valid) return <Navigate to={topicPath(locale, topicId) + location.search} replace />;
  if (topicPending) return <Spinner label={t(locale, 'loading')} />;
  if (!topic) {
    return topicError ? <ErrorBox locale={locale} message={errorMessage(topicError)} /> : <NotFound mode={mode} />;
  }

  const topicCards = query ? (search.data?.cards ?? EMPTY) : (cards.data ?? EMPTY);
  const error = list.error;

  return (
    <section>
      <Link
        to={homePath(locale, mode)}
        className="mb-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        {t(locale, isFaq ? 'backToFaqTopics' : 'backToTopics')}
      </Link>
      <h2 className="mb-1 text-2xl font-bold text-slate-900">{topic.title}</h2>
      {topic.description && <p className="mb-4 max-w-3xl text-slate-600">{topic.description}</p>}
      <div className="mb-6 max-w-xl">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder={t(locale, isFaq ? 'searchInFaqTopic' : 'searchInTopic')}
          autoFocus
        />
      </div>

      {error && <ErrorBox locale={locale} message={errorMessage(error)} />}
      {list.isPending ? (
        <Spinner label={t(locale, 'loading')} />
      ) : isFaq ? (
        (() => {
          // Keyed by question id: two questions can share one answer card.
          const items = query
            ? topicCards.map((c) => ({ key: c.card_id, view: faqCardView(c, false) }))
            : (questions.data ?? EMPTY).map((question) => ({ key: question.question_id, view: questionView(question) }));
          return items.length === 0 ? (
            <EmptyState locale={locale} />
          ) : (
            <div className="grid gap-2.5">
              {items.map(({ key, view }) => (
                <FaqItem key={key} card={view} locale={locale} />
              ))}
            </div>
          );
        })()
      ) : topicCards.length === 0 ? (
        <EmptyState locale={locale} />
      ) : (
        <div className="grid gap-4">
          {topicCards.map((c) => (
            <CardItem key={c.card_id} card={topicCardView(c)} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
