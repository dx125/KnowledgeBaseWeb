# Plan 3 — Search that understands meaning and works across languages

**Goal:** a user can ask in their own words and in any supported language — "can I leave the country while
my residency is pending?", "новая седула", "new cedula format", "Führerschein umtauschen" — and get the right
card even when no word overlaps with the card text, or the card only exists in another language.

This plan is **mostly backend**; the web changes are small. It lives here because it is a user-facing search
capability and shares the eval set and UI with Plan 2.

## 0. Decision D3 (2026-11-15): no paid APIs — the plan below is staged accordingly

Sections 3 and 4.3 were written assuming a hosted embedding provider; **that option is shelved**. Read them with
these changes; everything else (hybrid retrieval, RRF, schema, cache, eval gates) stands.

**Stage A — free, no model (do first, ships with Plan 2):**
1. **Search every locale, not just the UI locale.** Run the lexical query against each locale's `search_vector`
   with that locale's text-search config and max-pool per card, then display the user's locale (English
   fallback as today). A Portuguese or English query then finds cards whose best text is Russian/Spanish, and
   the 106/424 `pt` coverage gap stops mattering for retrieval. Needs the BR-1 query builder run once per locale.
2. **Match question phrasings**: trigram/FTS over the 371 localized phrasings routes straight to the answer card.
3. Alias expansion (BR-1) covers transliteration pairs (`седула`/`cédula`).
4. Measure with the eval harness (BR-9); stop here if the gates pass.

**Stage B — free semantic vectors (only if Stage A misses the paraphrase/cross-language gates):**
- **Model:** an open-weights multilingual embedding model (candidates: `multilingual-e5-small/base`, BGE-M3,
  or a similar small multilingual sentence model). Selected by the same bake-off, **cost = 0**. Avoid the
  Supabase built-in `gte-small` unless the bake-off proves otherwise (English-centric; expected weak on Russian).
- **Documents:** `scripts/embed.mjs` runs the model **locally in Node** (e.g. ONNX/transformers.js) on the dev
  machine; vectors go into the same `embedding_cache` → deploy path. No API key, no network at embed time after
  the one-time model download.
- **Queries** need the same model at search time, and an Edge Function cannot host it. Two free options:
  1. **In the browser** (transformers.js/WASM): embed the query on the device, send only the vector to
     `GET /search` (a `POST` with the vector, or hybrid RPC call); the query text never leaves the device.
     Cost: a one-time model download (tens of MB or more — measure; cache via the Cache API), CPU time on phones,
     lazy-loaded only after the first search.
  2. **Local sidecar** (small Node/Python service on `localhost`): fits D2, useless once hosted.
  Prefer option 1 because it keeps working after hosting without any paid service.
- **Consequences:** the rate-limit/abuse concern in §4.3 largely disappears (no per-query cost); the `embedding_cache`
  is only for documents; the Edge Function accepts a validated float array (fixed length, finite numbers, size cap).
- If the model download is judged too heavy for the public (D1) audience, keep Stage A only and ship Stage B as an
  opt-in "Smart search" toggle.

## 1. Why keyword search can't do this (verified)

- Matching is lexical per locale (`tsvector` + trigram). No overlap → no match.
- The query language must equal the card language. `pt` covers only **106 of 424 cards**; everything else
  falls back to English text, so a Portuguese-speaking user searching in Portuguese finds nothing for most
  topics.
- Known misses from real use: English `new cedula format` does not surface the new-format cédula card; Cyrillic
  `седула` is not the Latin `cédula` token. (Synonym expansion also ANDs its terms today — fixed in Plan 2/BR-1;
  semantic search complements it, it does not replace it.)

## 2. Approach: hybrid retrieval

Keep the lexical engine (exact terms, codes like `ITP`, `DGI`, `UTE`, names, accents fixed in Plan 2) and add a
vector engine; fuse with **Reciprocal Rank Fusion** (RRF, `score = Σ 1/(60 + rank_i)`), so neither score scale
needs calibrating. Lexical-only remains the fallback whenever the embedding service is unavailable.

Two retrieval targets, because we have two kinds of text:

1. **Card vectors** — one vector per *(card, locale)* built from title + short body + keywords + the first part
   of the body. Public bodies average ~750 characters (p95 ≈ 1.3 k, max ≈ 8.7 k) so a single vector per card is
   enough; truncate or take the leading sections for the rare long card (no chunking in v1).
2. **Question vectors** — one vector per question phrasing (371 phrasings across 90 questions). Matching a
   user's question to a *question* is the highest-precision path and routes straight to the answer card.

**Cross-language by construction:** use a **multilingual** embedding model so a query in any language lands near
the equivalent text in any other. Search all locale vectors of each card and **max-pool per card**, then display
the text in the user's locale using today's per-row English fallback. This fixes the `pt` coverage gap without
translating anything.

**Scale note:** ~1.8 k card vectors + ~0.4 k question vectors. An exact (sequential) cosine scan over that is a
few milliseconds. **Do not build HNSW/IVFFlat indexes now**; add one only when rows exceed ~50 k.

## 3. Embedding provider — decide by bake-off (Decision D3)

Do not pick by brand; pick by Recall@k on our own gold set (BR-9), then by latency, price and terms.

| Option | Pros | Cons |
|---|---|---|
| Hosted multilingual embedding API (candidates: Voyage multilingual models — Anthropic doesn't ship its own embedding model and its docs point to Voyage; OpenAI `text-embedding-3-*`; Cohere multilingual embed; Google's Gemini embedding) | best quality per effort; no hosting; Matryoshka/truncation options on some | query text leaves our infra; per-query latency (~100–300 ms) and cost; provider key to protect |
| Supabase Edge built-in `gte-small` (`Supabase.ai.Session`) | free, in-region, no key | trained mainly on English — expected to be weak for Russian/Portuguese; likely fails the bake-off |
| Self-hosted open multilingual model (e.g. `multilingual-e5-*`, BGE-M3) | full control, no third-party | too heavy for an Edge Function (bundle/memory/cold start); needs a separate always-on service |

*Model names, dimensions, limits and prices change often — confirm current values at implementation time; none
are asserted here.* Bake-off protocol: embed the gold set + all cards with 3 candidates (cost is cents at this
corpus size), compare Recall@1/3/10 and MRR per locale and per query class, pick the cheapest model within 1 pt of
the best. Record the decision, model id, dimension and date in this file.

**Privacy:** queries are sent to the provider. They contain no account identifiers; send only the query string,
use the provider's no-training / zero-retention option, and state this in the app's privacy note. Never embed or
send user profile data or journey answers (Plan 4).

## 4. Backend implementation (KnowledgeBase repo)

### 4.1 Schema — `0012_embeddings.sql` (BR-10)
```sql
create extension if not exists vector with schema extensions;

create table card_embeddings (
  card_id     text references cards(card_id) on delete cascade,
  locale      text not null,
  model       text not null,
  embedding   extensions.vector(<DIM>) not null,
  primary key (card_id, locale, model)
);
create table question_embeddings (
  question_id text references questions(question_id) on delete cascade,
  locale      text not null,
  phrasing_ix int  not null,
  model       text not null,
  embedding   extensions.vector(<DIM>) not null,
  primary key (question_id, locale, phrasing_ix, model)
);
-- NOT cleared by deploy's full replace (see 4.2):
create table embedding_cache (
  source_hash text primary key,       -- sha256(model || normalized text)
  model       text not null,
  embedding   extensions.vector(<DIM>) not null,
  created_at  timestamptz default now()
);
```
Enable RLS and revoke direct access exactly like `0004` (extend its table loop); grant `select` to
`service_role` only. `<DIM>` comes from the bake-off (prefer ≤ 1024; truncate if the model supports it).

### 4.2 Pipeline: embeddings must not break the atomic deploy
`deploy.mjs` deletes and reinserts everything in one transaction. Re-embedding on every deploy would be slow and
costly, and an API outage must not block a data deploy. So:

1. **`scripts/embed.mjs`** (runs *before* the transaction): builds the text for every card/locale and question
   phrasing, hashes it (`sha256(model + text)`), calls the provider only for hashes missing from `embedding_cache`
   (batched, retried with backoff), and upserts the cache. Idempotent; a second run does zero API calls.
2. `deploy.mjs` inserts `card_embeddings` / `question_embeddings` **from the cache** inside the transaction. Rows
   with no cached vector are skipped with a warning (lexical search still works for them). Deploy never calls the
   provider itself.
3. `deploy.mjs --dry-run` reports counts of vectors and cache misses. The deploy ledger (`kb_data_versions`) gets
   the embedding model id.
4. Embedding text recipe is versioned (`EMBED_RECIPE = 1`) and included in the hash, so changing the recipe
   re-embeds deliberately.

### 4.3 Query path (Edge Function, BR-10)
`GET /search?q=…&mode=hybrid|lexical` (default `hybrid` when the semantic feature is configured):

1. Normalize the query (trim, collapse spaces, NFC, lowercase for cache keys; cap at ~200 chars).
2. Look up `embedding_cache` by `sha256(model + normalized query)`; on miss call the provider with a **~800 ms
   timeout** and cache the result.
3. Call `search_cards_hybrid(p_query, p_embedding, p_locale, …filters…)`. On embedding failure or timeout,
   **fall back to lexical** and set response header `x-kb-search-mode: lexical-fallback`.
4. Secrets: provider key via `supabase secrets set`; never in the repo or the web app. Feature flag secret
   `KB_SEMANTIC=1` for gradual rollout.
5. **Abuse control:** sign-up is open, so anyone can mint accounts and burn the embedding budget. Add a
   per-user rate limit on cache-missing embedding calls (e.g. a small Postgres counter table, N/min and a daily
   cap), return `429` with a clear message, and degrade to lexical rather than failing.

### 4.4 `search_cards_hybrid` (BR-10)
- Lexical list: today's ranking after BR-1/2 (top 50).
- Vector lists: top 50 cards by `1 - (embedding <=> q)` **max-pooled over locales**, plus top 20 questions
  mapped to their `answer_card_id` (a question hit counts as a vector hit for that card).
- Drop vector candidates below a similarity floor calibrated on the gold set (noise guard — semantic search
  always returns *something*).
- Fuse with RRF; then apply the existing editorial multipliers (`search_boost`, alignment) and scope/filters
  from Plan 2; keep the title/snippet highlighting for lexical hits.
- Return `match_kind ∈ keyword | semantic | both` per result so the UI can explain itself.

### 4.5 Neighbours for "see also" (BR-11)
After embeddings load, compute for each card the 6 nearest other cards (RU vectors, excluding same-topic
siblings and existing links) and insert as `card_links.kind = 'semantic'` (Plan 1). Plain SQL with a lateral
join; ~424 × 424 distance computations — trivial.

## 5. Web implementation (small)

Phase 0 conventions apply (`docs/DEVELOPMENT.md`): response fields go into `src/lib/api.ts` types and the mock
(`src/mocks/api.ts`) in the same PR. If Stage B embeds queries in the browser, the model runtime and weights are
a lazy chunk/download triggered by the first search and must stay outside the `npm run size` first-load budget
(D9 — 150 kB gzip).

1. `search(params)` already carries `mode`; default stays server-chosen. Add `match_kind` to the response type.
2. `SearchResultItem`: when `match_kind === 'semantic'` show a subtle chip **"Found by meaning"** (with a
   tooltip "matches your question even though the words differ"); no highlight is expected there.
3. Search placeholder hints at the capability ("Ask in your own words, in any language").
4. If the response header says `lexical-fallback`, show nothing to the user (silent degradation), log to the
   console in dev.
5. Empty state suggests the three most-asked questions (shared with Plan 2).
6. If a result's text language differs from the UI language (`locale_used`), show "shown in English".
7. i18n keys: `foundByMeaning`, `foundByMeaningHint`, `askInAnyLanguage`, `shownInLanguage`, `rateLimited`.

## 6. Evaluation (the gate for this whole plan)

Build the harness first (BR-9, week 1) — it also validates Plan 2.

- **Gold set** (backend repo, **not** published): ≥ 300 `(locale, query, expected_card_ids)` cases:
  - question phrasings (easy; lexically biased),
  - independently written paraphrases with no word overlap,
  - accent-less, typo and transliteration variants (`cedula`, `седула`),
  - cross-language cases (RU query → card whose best text is EN/ES/DE/PT; PT queries on non-PT cards),
  - a reviewed sample of real chat questions with names and personal data removed,
  - **negative cases** (off-topic questions) to tune the similarity floor.
- **Metrics:** Recall@1/3/10, MRR, per locale and per class; plus latency percentiles for the hybrid path.
- **Gates:** hybrid must (a) not drop lexical Recall@3 by more than 1 pt on any locale, (b) improve the
  paraphrase and cross-language classes by an agreed margin (set after the baseline run), (c) return nothing
  (or a "no confident match" state) for negative cases above the floor.
- Re-run on every embedding-model, recipe, alias or ranking change; store results in the PR.

## 7. Rollout

1. Ship BR-9 + baseline numbers (lexical, after BR-1/2).
2. Deploy embeddings + hybrid RPC behind `KB_SEMANTIC` (off); run the harness against `mode=hybrid` directly.
3. Enable for the team/beta users; watch the Edge Function error/latency/429 rates.
4. Enable for everyone; keep `mode=lexical` as an escape hatch (query param + env flag).
5. After two weeks: review cost, cache hit rate, rate-limit hits; tune the floor.

## 8. Acceptance criteria

- `new cedula format`, `новая седула` and `permiso de reingreso` (in RU/EN/ES) all return the matching card in
  the top 3.
- A Portuguese query finds relevant Spanish/English-only cards (cross-language).
- Gold-set gates in §6 pass; documented in the PR.
- With the provider blocked (simulate by bad key / timeout), search still works (lexical) and the header says so.
- A full `embed.mjs` re-run makes **zero** provider calls; deploy succeeds with the provider unreachable.
- Per-user rate limit works (429, degraded results) and is covered by a test.
- p95 end-to-end search latency stays within the Plan 2 target for cache-hit queries; cache-miss p95 documented.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Semantic search surfaces plausible-but-wrong cards for legal/admin questions | similarity floor, negative-case tests, keep keyword results prominent in fusion, show trust badges as always |
| Provider outage, key leak, or cost abuse | lexical fallback, key only in Edge secrets, cache, per-user rate limit and daily cap |
| Multilingual model weak on Russian domain terms (`седула`, `ВНЖ`) | bake-off on our gold set; keep alias expansion (BR-1) as a second route |
| Vector dimension / model change invalidates data | `model` column + hash includes model + recipe; re-embed deliberately via cache |
| Deploy becomes slow or flaky | embedding is a separate pre-step; deploy only reads the cache |
| Gold set leaks personal data | strip names/handles/phones, store in backend repo outside published artifacts, review before committing |

## 10. Estimate

Backend 8–10 d: BR-9 harness + gold set 3, schema + `embed.mjs` + deploy integration 2.5, hybrid RPC + Edge
path + cache + rate limit 3, neighbours 0.5, tuning/bake-off 2 (overlaps). Web 2–3 d. Elapsed time is dominated
by building a trustworthy gold set.
