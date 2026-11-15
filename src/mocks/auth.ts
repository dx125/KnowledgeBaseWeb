// Mock Supabase Auth (GoTrue) — mock mode only.
//
// Implements the endpoints @supabase/supabase-js (auth-js 2.108) calls for this app, with
// the same paths and response shapes:
//   POST /auth/v1/token?grant_type=password       signInWithPassword
//   POST /auth/v1/token?grant_type=refresh_token  auto-refresh / expired session on load
//   POST /auth/v1/signup                          signUp → signed in at once (no email confirmation)
//   GET  /auth/v1/user                            getUser
//   POST /auth/v1/logout?scope=…                  signOut
//
// Any email + a password of ≥ 6 characters signs in. Tokens are fake but well-formed JWTs
// (never signed, never accepted anywhere else) that carry the user's identity, so the
// mock stays stateless: a session persisted by supabase-js keeps working after a page
// reload, when all in-page mock state starts empty again.

import { http, HttpResponse } from 'msw';
import { ANON_KEY, AUTH_BASE, latency } from './config';

const ACCESS_TOKEN_TTL_S = 3600; // GoTrue's default; supabase-js refreshes shortly before expiry
const MIN_PASSWORD_LENGTH = 6;

/** Sessions ended by sign-out during this page's lifetime. */
const revokedSessions = new Set<string>();

// --- encoding helpers -------------------------------------------------------------------
function b64url(text: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64url(part: string): string {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)));
}

/** Random hex. crypto.getRandomValues also works on plain-http origins, unlike randomUUID. */
function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
}

const uuidFromHex = (h: string) =>
  `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;

/** Stable UUID-shaped user id per email, so the same email always gets the same profile. */
function userIdFor(email: string): string {
  let hex = '';
  for (let seed = 0; seed < 4; seed++) {
    let h = 0x811c9dc5; // FNV-1a, 32-bit
    for (const ch of `${seed}:${email}`) {
      h ^= ch.codePointAt(0)!;
      h = Math.imul(h, 0x01000193);
    }
    hex += (h >>> 0).toString(16).padStart(8, '0');
  }
  return uuidFromHex(hex);
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+$/.test(email) ? email : null;
}

// --- GoTrue-shaped payloads ---------------------------------------------------------------
function userJson(email: string) {
  const id = userIdFor(email);
  const now = new Date().toISOString();
  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: now,
    phone: '',
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { email, email_verified: true, phone_verified: false, sub: id },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  };
}

function sessionJson(email: string, sessionId: string = uuidFromHex(randomHex(16))) {
  const user = userJson(email);
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: AUTH_BASE,
    sub: user.id,
    aud: 'authenticated',
    exp: now + ACCESS_TOKEN_TTL_S,
    iat: now,
    email,
    phone: '',
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
    role: 'authenticated',
    aal: 'aal1',
    amr: [{ method: 'password', timestamp: now }],
    session_id: sessionId,
    is_anonymous: false,
    mock: true, // marks tokens issued by this mock
  };
  const accessToken = [
    b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    b64url(JSON.stringify(claims)),
    b64url('mock signature (not verifiable)'),
  ].join('.');
  const refreshToken = `mock-refresh.${b64url(JSON.stringify({ email, sid: sessionId }))}.${randomHex(8)}`;
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: ACCESS_TOKEN_TTL_S,
    expires_at: now + ACCESS_TOKEN_TTL_S,
    refresh_token: refreshToken,
    user,
  };
}

export interface MockIdentity {
  userId: string;
  email: string;
  sessionId: string;
}

/** Identity behind an access token issued by this mock; null if missing, foreign, expired or signed out. */
export function readAccessToken(token: string): MockIdentity | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(unb64url(parts[1]));
    if (claims?.mock !== true || typeof claims.sub !== 'string' || typeof claims.email !== 'string') return null;
    if (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) return null;
    if (revokedSessions.has(claims.session_id)) return null;
    return { userId: claims.sub, email: claims.email, sessionId: claims.session_id };
  } catch {
    return null;
  }
}

function readRefreshToken(token: unknown): { email: string; sid: string } | null {
  if (typeof token !== 'string') return null;
  const m = /^mock-refresh\.([A-Za-z0-9_-]+)\.[0-9a-f]+$/.exec(token);
  if (!m) return null;
  try {
    const { email, sid } = JSON.parse(unb64url(m[1]));
    return typeof email === 'string' && typeof sid === 'string' ? { email, sid } : null;
  } catch {
    return null;
  }
}

const bearer = (request: Request) =>
  (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();

// GoTrue error body (legacy shape, which auth-js reads via `msg` and `error_code`).
const authError = (status: number, errorCode: string, msg: string, extra: object = {}) =>
  HttpResponse.json({ code: status, error_code: errorCode, msg, ...extra }, { status });

/** The API gateway in front of GoTrue rejects requests without the project's anon key. */
function apiKeyError(request: Request) {
  const key = request.headers.get('apikey');
  if (!key) return HttpResponse.json({ message: 'No API key found in request' }, { status: 401 });
  if (key !== ANON_KEY) return HttpResponse.json({ message: 'Invalid API key' }, { status: 401 });
  return null;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

export const authHandlers = [
  http.post(`${AUTH_BASE}/token`, async ({ request }) => {
    await latency();
    const keyError = apiKeyError(request);
    if (keyError) return keyError;
    const grant = new URL(request.url).searchParams.get('grant_type');
    const body = await readBody(request);

    if (grant === 'password') {
      const email = normalizeEmail(body.email);
      const password = body.password;
      if (!email || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        return authError(400, 'invalid_credentials', 'Invalid login credentials');
      }
      return HttpResponse.json(sessionJson(email));
    }
    if (grant === 'refresh_token') {
      const refresh = readRefreshToken(body.refresh_token);
      if (!refresh || revokedSessions.has(refresh.sid)) {
        return authError(400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found');
      }
      return HttpResponse.json(sessionJson(refresh.email, refresh.sid));
    }
    return authError(400, 'validation_failed', `grant_type "${grant}" is not supported by the mock`);
  }),

  http.post(`${AUTH_BASE}/signup`, async ({ request }) => {
    await latency();
    const keyError = apiKeyError(request);
    if (keyError) return keyError;
    const body = await readBody(request);
    const email = normalizeEmail(body.email);
    if (!email) return authError(400, 'validation_failed', 'Unable to validate email address: invalid format');
    if (typeof body.password !== 'string' || body.password.length < MIN_PASSWORD_LENGTH) {
      const message = `Password should be at least ${MIN_PASSWORD_LENGTH} characters.`;
      return authError(422, 'weak_password', message, { weak_password: { reasons: ['length'], message } });
    }
    // As with email confirmation turned off: the new user is signed in right away.
    return HttpResponse.json(sessionJson(email));
  }),

  http.get(`${AUTH_BASE}/user`, async ({ request }) => {
    await latency();
    const keyError = apiKeyError(request);
    if (keyError) return keyError;
    const who = readAccessToken(bearer(request));
    if (!who) return authError(403, 'bad_jwt', 'invalid JWT: unable to parse or verify signature, or token is expired');
    return HttpResponse.json(userJson(who.email));
  }),

  http.post(`${AUTH_BASE}/logout`, async ({ request }) => {
    await latency();
    const keyError = apiKeyError(request);
    if (keyError) return keyError;
    const who = readAccessToken(bearer(request));
    if (who) revokedSessions.add(who.sessionId);
    return new HttpResponse(null, { status: 204 });
  }),
];
