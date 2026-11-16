// Route elements that decide *whether* and *where* to render, before any screen.
import { lazy, Suspense } from 'react';
import { Navigate, Outlet, ScrollRestoration, useLocation, useParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { Spinner } from '../components/Feedback';
import { useProfile } from '../data/queries';
import { t } from '../i18n';
import { isConfigured } from '../lib/api';
import { isLocale, splitLang, swapLang } from '../lib/paths';
import { asLocale, LocaleProvider, readStoredLocale, useLocale, useSwitchLocale } from './locale';

// Only signed-out visitors need the login form: its own chunk.
const Login = lazy(() => import('../components/Login').then((m) => ({ default: m.Login })));

/**
 * Shown while the first screen's code loads (before any route renders, so no locale
 * context yet: the language comes from the URL, or the last used one).
 */
export function BootSpinner() {
  const locale = splitLang(window.location.pathname).lang ?? readStoredLocale();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label={t(locale, 'sessionLoading')} />
    </div>
  );
}

/** Top of the tree: scroll to top on new pages, restore the position on Back/Forward. */
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

/** `/` → `/{last used language}`. Signed in, SessionGate then moves to the account's language. */
export function RootRedirect() {
  return <Navigate to={`/${readStoredLocale()}`} replace />;
}

/**
 * `/:lang/*`: provides the language. A path that does not start with a supported language
 * is treated as a path without one: `/topics/renting` → `/ru/topics/renting`.
 */
export function LangRoute() {
  const { lang } = useParams();
  const location = useLocation();
  if (!isLocale(lang)) return <Navigate to={swapLang(location, readStoredLocale())} replace />;
  return (
    <LocaleProvider locale={lang}>
      <Outlet />
    </LocaleProvider>
  );
}

function FullPageSpinner() {
  const locale = useLocale();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label={t(locale, 'sessionLoading')} />
    </div>
  );
}

/**
 * Everything under /:lang needs a session. Signed out, the login form is shown at the
 * requested URL, which therefore survives sign-in. Signed in, the account's default
 * language wins: a URL in another language is redirected to it (decision: profile first).
 */
export function SessionGate() {
  const locale = useLocale();
  const location = useLocation();
  const { user, loading, signIn, signUp } = useAuth();
  const switchLocale = useSwitchLocale();
  const signedIn = isConfigured && !!user;
  const profile = useProfile({ enabled: signedIn });

  if (!isConfigured) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">{t(locale, 'configError')}</h1>
        <p className="text-sm text-slate-600">{t(locale, 'configErrorHint')}</p>
      </div>
    );
  }

  // Wait for the profile too, so content is never fetched or shown in the wrong language.
  if (loading || (signedIn && profile.isPending)) return <FullPageSpinner />;

  if (!user) {
    return (
      <Suspense fallback={<FullPageSpinner />}>
        <Login locale={locale} onLocaleChange={switchLocale} onSignIn={signIn} onSignUp={signUp} />
      </Suspense>
    );
  }

  const accountLocale = asLocale(profile.data?.default_locale); // null if the profile failed to load
  if (accountLocale && accountLocale !== locale) {
    return (
      <>
        <Navigate to={swapLang(location, accountLocale)} replace />
        <FullPageSpinner />
      </>
    );
  }

  return <Outlet />;
}
