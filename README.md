# KnowledgeBase Web

Browser client for the **Uruguay Knowledge Base** — practical, multilingual relocation
knowledge distilled from community chats. Vite + React + TypeScript + Tailwind.

This repo is **web only**. The database, HTTP API (Supabase Edge Function), data pipeline
and dataset live in the separate **KnowledgeBase** (backend) repo. The web app is a pure
API client: it never talks to Postgres.

## What it does today

- Sign in / sign up (Supabase Auth, email + password); every data call needs a signed-in user.
- Browse topics, search the whole base or one topic, switch locale (`ru/en/es/de/pt`;
  the choice is saved as the account default).
- **Q&A** tab: "Most asked" questions ranked by `ask_frequency`, per-topic browse, search.
- Card panel with related glossary terms, entities and official resources.
- Toggle to include internal / unreviewed cards (always flagged in the UI).

## Quick start

```bash
npm install
cp .env.example .env     # fill in the two PUBLIC values (project URL + anon key)
npm run dev              # http://localhost:5173
npm run build            # type-check + production build into dist/
```

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
  Responses take 100–300 ms so loading states are visible. Known differences from the real API
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
  run `bash scripts/pack.sh` → `../kb-web-upload.zip` (source only; the script fails if env files,
  build output or likely secrets would be included).

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
  App.tsx                 # screens + data loading (to be split by route — see plans)
  components/             # CardItem, FaqItem, TopicGrid, SearchBar, Login, ...
  lib/api.ts              # typed client for the backend API
  lib/auth.ts             # supabase-js client (AUTH ONLY)
  i18n.ts                 # UI-chrome strings for ru/en/es/de/pt (content comes from the API)
  mocks/                  # mock mode only: MSW handlers (API + auth) and synthetic fixtures
scripts/pack.sh           # builds the sandbox upload archive
docs/
  API-CONTRACT.md         # the backend endpoints this client consumes
  BACKEND-REQUESTS.md     # backend work the web roadmap needs (tracked in the backend repo)
  POLISH-web.md           # web-side items split out of the old backend POLISH plan
  plans/                  # implementation plans (roadmap, links, search, semantic, journeys)
CHANGELOG.md
```

## Roadmap

Detailed implementation plans are in [docs/plans/](docs/plans/README.md):

1. [Shareable links, a page per card, "see also"](docs/plans/01-shareable-links-card-pages.md)
2. [Instant search with highlighting and filters](docs/plans/02-instant-search.md)
3. [Search that understands meaning, across languages](docs/plans/03-semantic-search.md)
4. [Guided step-by-step journeys](docs/plans/04-guided-journeys.md)

## License

See [LICENSE](LICENSE).
