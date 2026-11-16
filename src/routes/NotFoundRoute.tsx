import { Link } from 'react-router';
import { useLocale } from '../app/locale';
import { useSection } from '../app/AppLayout';
import { t } from '../i18n';
import { homePath, type Mode } from '../lib/paths';

export function NotFound({ mode }: { mode: Mode }) {
  const locale = useLocale();
  return (
    <section className="py-16 text-center">
      <h2 className="text-2xl font-bold text-slate-900">{t(locale, 'notFoundTitle')}</h2>
      <p className="mt-2 text-slate-600">{t(locale, 'notFoundHint')}</p>
      <Link
        to={homePath(locale, mode)}
        className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        {t(locale, mode === 'faq' ? 'backToFaqTopics' : 'backToTopics')}
      </Link>
    </section>
  );
}

/** Any path under /:lang that no route matches. */
export function NotFoundRoute() {
  return <NotFound mode={useSection().mode} />;
}
