# API contract the web app consumes

Owned by the backend repo (`supabase/functions/kb/index.ts`, README "HTTP API"). This is the
client's working summary; if the two disagree, the backend wins — and fix this file.
The offline mock in `src/mocks/` (MSW) implements this contract and is what `npm run dev:mock`, every Vitest
test and the Playwright suite run against — keep it in sync with this file (an endpoint change updates the
contract, `src/lib/api.ts` and the mock in the same PR). Its deliberate differences from the real API are
listed at the top of `src/mocks/api.ts`.

Base URL: `<VITE_SUPABASE_URL>/functions/v1/kb`. Every route except `GET /` requires headers
`apikey: <anon key>` and `Authorization: Bearer <user access token>`. The anon key alone → `401`.

| Route | Client wrapper (`src/lib/api.ts`) | Hook (`src/data/queries.ts`) | Notes |
|---|---|---|---|
| `GET /me`, `PUT /me {default_locale}` | `getMe`, `setDefaultLocale` | `useProfile`, `useSaveDefaultLocale` | stored default locale; the UI language follows it while signed in |
| `GET /topics?locale&internal` | `listTopics` | `useTopics` | topics with ≥1 card in scope |
| `GET /topics/:id/cards?locale&internal&category` | `getTopicCards` | `useTopicCards` | landing cards first |
| `GET /search?q&locale&topic&category&limit&offset&internal` | `searchCards` | `useSearch` | `limit` ≤ 100; returns `results[]`, `total` |
| `GET /questions?locale&topic&limit&internal` | `listQuestions` | `useQuestions` | ranked by `ask_frequency`, includes the answer card text |
| `GET /cards/:id?locale` | `getCard` | `useCardDetail` | keywords, subtopics, glossary, entities, resources |
| `GET /version` | — | deployed dataset version |

Conventions

- **Locale:** explicit `?locale=` → user's stored default → `ru`. Unknown value → `en`. Supported:
  `ru en es de pt`. Missing translations fall back to `en` **per row** (so a `pt` request can return
  English text; the client must not assume the requested language).
- **Scope:** default is public + active cards. `internal=1` adds internal / unreviewed cards. This is a
  convenience for signed-in users, not a security boundary; `GET /cards/:id` is not scope-filtered.
- **IDs:** `topic.<slug>`, `card.<topic>.<kind>.<slug>`; FAQ answers live under `topic.faq_*` as ordinary
  cards. Questions are `q.<faq topic>.<qNN_slug>` and point at an `answer_card_id`.
- **Errors:** `{ "error": string, "message"?: string }` with `400/401/404/405/500`.
- **Client side:** every `GET` wrapper takes an optional `AbortSignal` (react-query passes one and cancels
  requests whose result is no longer needed). Non-2xx responses throw `ApiError` (`status`, message
  `API <status>[: <message>]`). Hooks never retry 4xx; network errors and 5xx are retried once. Responses are
  cached for 5 minutes per parameters + `locale` + `internal`; the cache is cleared when the signed-in user changes.
- **Known gaps** the roadmap closes: no highlighted snippets, no facets, no card-to-card links, no
  semantic search, no journeys endpoints (see `BACKEND-REQUESTS.md`).

## Supabase Auth (GoTrue) endpoints

Sign-in goes through `@supabase/auth-js` (`src/lib/auth.ts`, the only Supabase package in the app), base
`<VITE_SUPABASE_URL>/auth/v1`, header `apikey: <anon key>`. The mock (`src/mocks/auth.ts`) implements these:

| Route | Used for |
|---|---|
| `POST /token?grant_type=password` | sign in (email + password) |
| `POST /token?grant_type=refresh_token` | automatic session refresh, restoring an expired session on load |
| `POST /signup` | create account (the real project may require email confirmation first) |
| `GET /user` | not called by the app today (auth-js `getUser()`); implemented by the mock for completeness |
| `POST /logout?scope=…` | sign out |

The session is persisted in `localStorage` under `sb-<project ref>-auth-token` (the key supabase-js used, so
existing sessions stay valid).
