# API contract the web app consumes

Owned by the backend repo (`supabase/functions/kb/index.ts`, README "HTTP API"). This is the
client's working summary; if the two disagree, the backend wins — and fix this file.
The offline mock in `src/mocks/` (MSW, `npm run dev:mock`) implements this contract — keep it in sync with this file.

Base URL: `<VITE_SUPABASE_URL>/functions/v1/kb`. Every route except `GET /` requires headers
`apikey: <anon key>` and `Authorization: Bearer <user access token>`. The anon key alone → `401`.

| Route | Client wrapper (`src/lib/api.ts`) | Notes |
|---|---|---|
| `GET /me`, `PUT /me {default_locale}` | `getMe`, `setDefaultLocale` | stored default locale |
| `GET /topics?locale&internal` | `listTopics` | topics with ≥1 card in scope |
| `GET /topics/:id/cards?locale&internal&category` | `getTopicCards` | landing cards first |
| `GET /search?q&locale&topic&category&limit&offset&internal` | `searchCards` | `limit` ≤ 100; returns `results[]`, `total` |
| `GET /questions?locale&topic&limit&internal` | `listQuestions` | ranked by `ask_frequency`, includes the answer card text |
| `GET /cards/:id?locale` | `getCard` | keywords, subtopics, glossary, entities, resources |
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
- **Known gaps** the roadmap closes: no highlighted snippets, no facets, no card-to-card links, no
  semantic search, no journeys endpoints (see `BACKEND-REQUESTS.md`).
