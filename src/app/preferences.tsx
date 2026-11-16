// In-memory UI preferences that outlive navigation (not part of any URL).
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ScopeParams } from '../data/keys';
import { useLocale } from './locale';

interface Preferences {
  /** Show internal / unreviewed cards too. Not saved: resets on reload. */
  includeInternal: boolean;
  setIncludeInternal: (value: boolean) => void;
}

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [includeInternal, setIncludeInternal] = useState(false);
  const value = useMemo(() => ({ includeInternal, setIncludeInternal }), [includeInternal]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Preferences {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}

/** The content scope every query is keyed by: the page's language + the internal toggle. */
export function useScope(): ScopeParams {
  const locale = useLocale();
  const { includeInternal } = usePreferences();
  return useMemo(() => ({ locale, includeInternal }), [locale, includeInternal]);
}
