# KnowledgeBase Web

Browser client for the **Uruguay Knowledge Base** — practical, multilingual relocation
knowledge distilled from community chats. Vite + React + TypeScript + Tailwind.

This repo is **web only**. The database, HTTP API (Supabase Edge Function), data pipeline
and dataset live in the separate **KnowledgeBase** (backend) repo. The web app is a pure
API client: it never talks to Postgres.

## What it does today

- Sign in / sign up (Supabase Auth, email + password); every data call needs a signed-in user.
- Browse topics, search the whole base or one topic, switch locale (`ru/en/es/de/pt`;
  the choice is saved as the account default, which always wins while signed in).
- **Q&A** tab: "Most asked" questions ranked by `ask_frequency`, per-topic browse, search.
- Card panel with related glossary terms, entities and official resources.
- Toggle to include internal / unreviewed cards (always flagged in the UI).
- Every screen has a URL (see [Routes](#routes)): links can be shared, reloads keep the
  page, and Back/Forward work like on any website.

## Quick start

```bash
npm install
cp .env.example .env     # fill in the two PUBLIC values (project URL + anon key)
npm run dev              # http://localhost:5173
npm run build            # type-check + production build into dist/
```

| Script | What it does |
|---|---|
| `npm run dev` / `dev:mock` | dev server (real backend / [mock mode](#running-without-a-backend-mock-mode)) |
| `npm run build` / `build:mock` | type-check + production build into `dist/` |
| `npm run size` | initial-JS budget check: ≤ 150 kB gzip for the first screen (signed-in home, login) |
| `npm run typecheck` | `tsc` for the app, tests and tool configs |
| `npm run lint` | ESLint (TypeScript, React hooks, jsx-a11y); zero warnings allowed |
| `npm test` / `test:watch` | Vitest unit, component and whole-app tests |
| `npm run test:coverage` | the same with coverage (fails under the thresholds in `vitest.config.ts`) |
| `npm run e2e` | Playwright browser tests against a mock-mode build (first time: `npx playwright install chromium`) |

You need a deployed backend (Edge Function `kb` + data) — see the KnowledgeBase repo README.
No backend at hand? Use mock mode below.

## Running without a backend (mock mode)

```bash
npm ci
npm run dev:mock     # http://localhost:5173 — no backend, no .env needed
npm run build:mock   # type-check + build with the mock included (into dist/)
```

- **What is mocked:** both network dependencies, inside the browser, by [MSW](https://mswjs.io):
  the KB API (every route in [docs/API-CONTRACT.md](docs/API-CONTRACT.md), incl. 401s, locale
  fallback, internal scope, search, Q&A) and Supabase Auth (sign-up, sign-in, token refresh,
  sign-out). Any email with a password of 6+ characters signs in; sign-up signs you in directly.
  Responses take 100–300 ms so loading states are visible (instant under Vitest). Known differences from the real API
  are listed at the top of `src/mocks/api.ts`.
- **The data is synthetic:** hand-written sample content in `src/mocks/fixtures/` (8 topics,
  31 cards, 10 questions) — no real people, messages or dataset rows, and not relocation advice.
- **Config:** the committed `.env.mock` holds dummy values only (`VITE_MOCK_API=1`, a fake project
  URL and key) and overrides `.env` in this mode.
- **Real mode is unchanged:** `npm run dev` / `npm run build` don't include the mock.
- Browser support: MSW uses a Service Worker on `localhost`/https; on a plain-http, non-localhost
  address it intercepts inside the page instead. A `build:mock` output contains the fixtures —
  never deploy it.
- Upload archive for a sandbox: double-click `pack-upload.cmd` (Windows, needs Git for Windows) or
  run `bash scripts/pack.sh` → `../kb-web-upload.zip`. Source only — no `docs/`, dependencies or
  build output; the script fails if env files or likely secrets would be included.

## Routes

The language is a path prefix; topic slugs carry no language, so a link works in every locale.
Built and parsed only in `src/lib/paths.ts`.

| Path | Screen |
|---|---|
| `/` | redirect to `/{lang}` (last used language, default `ru`) |
| `/:lang` · `/:lang?q=…` | knowledge-base topics · search results |
| `/:lang/topics/:slug` · `?q=…` | a topic's cards · search within it (`topic.renting` → `renting`) |
| `/:lang/faq` · `?q=…` | Q&A: most asked + Q&A topics · Q&A search |
| `/:lang/faq/topics/:slug` · `?q=…` | a Q&A topic's questions · search within it |
| anything else | "page not found" with a link home |

- `:lang` is `ru|en|es|de|pt`. A path without a valid language gets one (`/topics/renting` →
  `/ru/topics/renting`). Switching language swaps the prefix and keeps the page (history
  *replace*, so Back moves between pages, not languages).
- Signed in, the account's default language always wins: the language switcher saves to it,
  and a link in another language is redirected to it.
- Signed out, the login form is shown at the requested URL; after sign-in that page opens.
- The first search adds a history entry; refining it replaces that entry.
- The internal/unreviewed toggle is a per-session preference, not part of any URL.

## Architecture

- **Routing:** react-router 7 data router (`createBrowserRouter`). Route table in
  `src/app/routes.tsx`: `LangRoute` (language from the URL) → `SessionGate` (config check,
  session, login, account-language redirect) → `AppLayout` (header, tabs, footer) → screens in
  `src/routes/`. `ScrollRestoration` restores the scroll position on Back.
- **Data:** `@tanstack/react-query`. `src/lib/api.ts` is the typed HTTP client (every call
  accepts an `AbortSignal`, errors are `ApiError` with a status); `src/data/` holds the query
  keys (every content key includes `locale` and `internal`), query options and hooks. Requests
  whose result is no longer needed are cancelled, stale responses can't overwrite newer ones,
  and results are cached for 5 minutes. The cache is cleared whenever the signed-in user changes.
- **Auth:** `src/auth/AuthProvider.tsx` (Supabase session in context), on `@supabase/auth-js`
  only — the app never uses Supabase's database/realtime/storage clients.
- **Code splitting:** screens are lazy route modules (`lazy` in `src/app/routes.tsx`), the login
  form a lazy component. Budget: ≤ 150 kB gzip of JS before the first screen (`npm run size`).

## Testing

- **Vitest + React Testing Library** (`src/**/*.test.ts(x)`, jsdom). The backend is the same MSW
  mock as mock mode, run in Node (`src/test/server.ts`), so tests exercise the real client code
  against the API contract; per-test overrides use `server.use(...)`.
  - `src/App.test.tsx` — whole-app behaviour (sign-in, browsing, search, Q&A, language,
    internal toggle, errors). Written before the router/react-query refactor and kept unchanged
    as the no-regression contract.
  - `src/app/routing.test.tsx` — URLs, Back/Forward, deep links, reload, redirects.
  - `src/app/a11y.test.tsx` — axe-core (WCAG 2.0–2.2 A/AA) on every screen and state.
  - unit/component tests next to the code (`lib/`, `data/`, `auth/`, `components/`).
- **Playwright** (`e2e/`) — smoke, navigation and accessibility journeys in Chromium (desktop + phone
  viewport) against a mock-mode production build (`dist-e2e/`, served by `vite preview`); the axe scans
  there also check colour contrast.
- **CI** (`.github/workflows/ci.yml`): type-check → lint → tests with coverage → builds →
  Playwright. No secrets; it also fails if `dist/` or a real `.env` file is tracked.

## Documentation

| Doc | For |
|---|---|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | working in the code: structure, adding screens / API calls / strings, testing rules |
| [docs/API-CONTRACT.md](docs/API-CONTRACT.md) | every backend and auth endpoint the client uses, with its wrapper and hook |
| [docs/plans/README.md](docs/plans/README.md) | roadmap: current state, decisions (D1–D9), Phase 0 status, schedule |
| [docs/BACKEND-REQUESTS.md](docs/BACKEND-REQUESTS.md) | backend work the roadmap needs |
| [CHANGELOG.md](CHANGELOG.md) | what changed, when |

## Configuration & security

| Variable | Notes |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL. API base = `<url>/functions/v1/kb`. |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** key (auth + `apikey` header). |

**Everything in `.env` is public.** Vite inlines `VITE_*` values into the shipped JavaScript.
Never add a service-role key, database URL, API secret, or personal data to this repo or to
`.env`. `.env` and `dist/` are git-ignored (the build output embeds those values). The anon key
alone cannot read data: the API additionally requires a signed-in user's token.

If a secret is ever committed here, rotate it first, then clean history.

## Layout

```
src/
  main.tsx                # starts the mock (mock mode), creates the router, renders <App>
  App.tsx                 # providers: react-query → auth → preferences → router
  app/                    # route table, guards (language, session), layout, locale, preferences, error page
  routes/                 # screens, lazy-loaded: HomeRoute, TopicRoute, NotFound (+ ?q= search hook)
  data/                   # react-query: query keys, query options + hooks, client defaults
  auth/                   # AuthProvider / useAuth (Supabase session)
  components/             # CardItem, FaqItem, TopicGrid, SearchBar, Login, ...
  lib/api.ts              # typed client for the backend API
  lib/paths.ts            # URL scheme: path builders, topic slugs, language prefix
  lib/auth.ts             # Supabase Auth client (@supabase/auth-js; AUTH ONLY)
  i18n.ts                 # UI-chrome strings for ru/en/es/de/pt (content comes from the API)
  mocks/                  # mock mode + tests: MSW handlers (API + auth) and synthetic fixtures
  test/                   # test setup and helpers (MSW server, render/sign-in helpers)
e2e/                      # Playwright tests
scripts/pack.sh           # builds the sandbox upload archive (pack-upload.cmd: one-click on Windows)
scripts/check-bundle-size.mjs  # `npm run size`: initial-JS budget check
.github/workflows/ci.yml  # CI: typecheck, lint, tests, builds, size, Playwright
docs/
  DEVELOPMENT.md          # how to work in this codebase: structure, recipes, testing rules
  API-CONTRACT.md         # the backend endpoints (and auth endpoints) this client consumes
  BACKEND-REQUESTS.md     # backend work the web roadmap needs (tracked in the backend repo)
  POLISH-web.md           # web-side items split out of the old backend POLISH plan
  plans/                  # implementation plans (roadmap, links, search, semantic, journeys)
CHANGELOG.md
```

## Roadmap

Detailed implementation plans are in [docs/plans/](docs/plans/README.md) (status, decisions, schedule):

0. Foundation — router, data layer, tests, CI — **done 2026-11-16**
   ([status and follow-ups](docs/plans/README.md#phase-0--foundation-done-2026-11-16))
1. [Shareable links, a page per card, "see also"](docs/plans/01-shareable-links-card-pages.md)
2. [Instant search with highlighting and filters](docs/plans/02-instant-search.md)
3. [Search that understands meaning, across languages](docs/plans/03-semantic-search.md)
4. [Guided step-by-step journeys](docs/plans/04-guided-journeys.md)

## License

See [LICENSE](LICENSE).
