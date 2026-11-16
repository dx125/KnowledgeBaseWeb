// Mock backend settings. Mock mode only (VITE_MOCK_API=1, see .env.mock).
//
// The URLs are derived exactly like src/lib/auth.ts does, but deliberately NOT imported
// from it: importing src/lib/auth creates the Supabase client (and may start a token
// refresh), which must not happen before the mock worker is listening. For the same
// reason, files under src/mocks only ever `import type` from src/lib.
import { delay } from 'msw';

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
export const ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
export const KB_BASE = `${SUPABASE_URL}/functions/v1/kb`;
export const AUTH_BASE = `${SUPABASE_URL}/auth/v1`;

/**
 * 100–300 ms of artificial latency so loading states are visible. None under Vitest
 * (MODE === 'test'): tests that need a slow response add their own handler.
 */
export const latency = () =>
  import.meta.env.MODE === 'test' ? Promise.resolve() : delay(100 + Math.floor(Math.random() * 201));
