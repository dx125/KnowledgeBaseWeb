// Loaded with the app (not lazily): it is also what shows when a lazy route's chunk fails
// to download (offline, or a new deploy replaced the files). The link reloads the page.
import { useRouteError } from 'react-router';
import { ErrorBox } from '../components/Feedback';
import { t } from '../i18n';
import { homePath, splitLang } from '../lib/paths';
import { readStoredLocale } from './locale';

/** Last resort for errors thrown while rendering a route: message + a way home. */
export function RouteError() {
  const error = useRouteError();
  const locale = splitLang(window.location.pathname).lang ?? readStoredLocale();
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center p-6">
      <ErrorBox locale={locale} message={message} />
      <a href={homePath(locale)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
        {t(locale, 'backToTopics')}
      </a>
    </div>
  );
}
