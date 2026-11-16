// The UI language comes from the URL prefix (/ru/…, /en/…). Signed in, the account's
// default locale wins: SessionGate redirects to it, and every switch saves to it.
// localStorage remembers the last language for `/` and the login screen.
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useSaveDefaultLocale } from '../data/queries';
import { DEFAULT_LOCALE, type Locale } from '../i18n';
import { isLocale, swapLang } from '../lib/paths';

const STORAGE_KEY = 'kb.locale';

/** `value` if it is a supported UI locale, else null. */
export function asLocale(value: unknown): Locale | null {
  return typeof value === 'string' && isLocale(value) ? value : null;
}

/** The language last used on this device, or the default. */
export function readStoredLocale(): Locale {
  try {
    return asLocale(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Remember the language on this device and mark the document's language. */
export function rememberLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable */
  }
  document.documentElement.lang = locale;
}

const LocaleContext = createContext<Locale | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => rememberLocale(locale), [locale]);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** The UI language of the current page. */
export function useLocale(): Locale {
  const locale = useContext(LocaleContext);
  if (!locale) throw new Error('useLocale must be used under a /:lang route');
  return locale;
}

/**
 * Switch language: same page under the other prefix (history *replace*, so Back moves
 * between pages, not languages), saved as the account default when signed in.
 */
export function useSwitchLocale(): (next: Locale) => void {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const saveDefaultLocale = useSaveDefaultLocale();
  return useCallback(
    (next: Locale) => {
      if (user) saveDefaultLocale(next); // updates the cached profile first, so SessionGate agrees
      rememberLocale(next);
      navigate(swapLang(location, next), { replace: true, preventScrollReset: true });
    },
    [user, saveDefaultLocale, location, navigate],
  );
}
