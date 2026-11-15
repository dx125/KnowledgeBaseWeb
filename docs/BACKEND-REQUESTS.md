# Backend requests from the web roadmap

Work the web plans need from the **KnowledgeBase** (backend) repo. Each item should be copied into that
repo's tracker when scheduled; this file is the web side's source of truth for *what* and *why*. Detailed
designs are in the linked plans.

Status legend: ☐ not started · ◐ in progress · ☑ done and **deployed**.

| ID | Request | Plan | Pri | Size | Status |
|---|---|---|---|---|---|
| **BR-0** | Link the Supabase CLI to the project; deploy the Edge Function `kb` (verify `?locale=pt` actually returns Portuguese); add a CI deploy job | all | **P0** | 0.5 d | ☐ |
| **BR-1** | Query builder `kb_build_tsquery`: **OR** the synonym expansion per token, AND across tokens, prefix-match the last token (today synonyms are ANDed — verified) | 2, 3 | **P0** | 1 d | ☐ |
| **BR-2** | Accent-insensitive search via `unaccent` text-search configurations `kb_ru/en/es/de/pt` (POLISH item I) + immutable unaccent in trigram; redeploy data | 2, 3 | **P0** | 1.5 d | ☐ |
| **BR-9** | Relevance eval harness `scripts/eval-search.mjs` + gold set (kept private, no personal data) | 2, 3 | **P0** | 3 d | ☐ |
| BR-3 | `search_cards` returns `title_hl` + `snippet` via `ts_headline` with private-use delimiters, computed after `limit`; add `matched_via` | 2 | P1 | 1 d | ☐ |
| BR-4 | Filters (`topic`, `cat`, `type`), `sort`, and `search_facets` RPC; `/search` params + `facets=1`; allow-list validation | 2 | P1 | 1.5 d | ☐ |
| BR-5 | Latency: `Server-Timing` header, skip profile lookup when `locale` is given, local JWT verification with `getUser` fallback | 2 | P1 | 1 d | ☐ |
| BR-6 | `card_links` table + ingest rules (drop whole-topic `related_card_ids`; keep editorial; keep prerequisites); `get_card` returns `links` and `locale_used`, accepts `internal` | 1 | P1 | 1.5 d | ☐ |
| BR-7 | `card_aliases` (old id → new id); `get_card` returns `redirect_to`; stable-ID policy documented | 1, 4 | P1 | 0.5 d | ☐ |
| BR-8 | Add `related_card_ids` to the ~90 FAQ answers in `faq.json` (semi-automatic from neighbours, then reviewed) | 1 | P2 | 1 d | ☐ |
| BR-10 | **Stage A (free, do first):** search all locales' vectors + question phrasings, max-pool per card (part of BR-1 follow-up, ~1 d). **Stage B (only if gates fail; D3 = no paid APIs):** pgvector, `card_embeddings` / `question_embeddings` / `embedding_cache`, local `scripts/embed.mjs` with an open-weights model, deploy reads cache, `search_cards_hybrid` (RRF) accepting a client-computed query vector (validated), no provider key | 3 | P1 | 1 d + 5 d | ☐ |
| BR-11 | Semantic neighbours inserted as `card_links.kind='semantic'` after embeddings load | 1, 3 | P2 | 0.5 d | ☐ |
| BR-12 | Journeys: `journeys.json` authoring format, `journeys` + `journey_card_refs` tables, `apply-journeys.mjs` with validation (cards exist/public, DAG, facts, translations), `/journeys` endpoints, `preview-journey.mjs` | 4 | P1 | 4–5 d | ☐ |
| ~~BR-12b~~ | ~~journey progress sync~~ — **dropped** (D4: progress stays on the device) | 4 | — | — | ✖ |
| **BR-13** | **(D1: approved)** open, unauthenticated read endpoints for public+active content — topics, cards, search, questions, journeys — hard-filtered **in SQL** (never reuse `get_card`), cache headers, per-IP rate limit, no user data in responses. Prerequisite for web Plans 1, 2, 4 working signed-out | 1, 2, 4 | **P1** | 3 d | ☐ |
| BR-14 | **Deferred (D2 = localhost).** After hosting is chosen: restrict CORS `Access-Control-Allow-Origin` from `*` to the web origin(s); add the origin(s) to the Supabase Auth site/redirect URLs in `supabase/config.toml` and the dashboard | 1 | P2 | 0.5 d | ☐ |

## Standing rules for backend changes

- A migration is not done until it is **applied** and the data redeployed where needed; an Edge Function change is
  not done until `supabase functions deploy kb` has run.
- New tables get RLS and the same direct-access revoke as migration `0004`; only `service_role` reads them.
- Any ranking/search change must be justified with eval-harness numbers (BR-9) in the PR.
- Keep `docs/API-CONTRACT.md` (this repo) in sync when endpoints or fields change.
- Never put secrets, personal data, or raw chat messages in either repo.
