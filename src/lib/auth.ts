import { AuthClient } from '@supabase/auth-js';

// Supabase is used ONLY for authentication (Supabase Auth / GoTrue), so the app depends on
// @supabase/auth-js directly instead of @supabase/supabase-js: createClient() also builds
// the database, realtime, storage and functions clients, which this app never uses
// (≈ 35 kB gzip). All data goes through the Edge Function API.
const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isConfigured = Boolean(url && anonKey);

if (!isConfigured) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.');
}

// Shared config the API client also needs.
export const SUPABASE_URL = url.replace(/\/$/, '');
export const ANON_KEY = anonKey;
export const API_BASE = `${SUPABASE_URL}/functions/v1/kb`;

/**
 * Where the session is persisted — the key supabase-js uses (`sb-<project ref>-auth-token`),
 * so sessions stored before the switch to auth-js stay valid.
 */
function storageKeyFor(projectUrl: string): string {
  try {
    return `sb-${new URL(projectUrl).hostname.split('.')[0]}-auth-token`;
  } catch {
    return 'sb-unconfigured-auth-token';
  }
}

// Same options supabase-js's createClient() passes to its auth client. Without
// configuration a placeholder URL keeps the module loadable, so the app can show its
// "not configured" screen (it never calls the client in that state).
export const authClient = new AuthClient({
  url: `${isConfigured ? SUPABASE_URL : 'http://unconfigured.invalid'}/auth/v1`,
  headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey },
  storageKey: storageKeyFor(url),
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'implicit',
});
