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
