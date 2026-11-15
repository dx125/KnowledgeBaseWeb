# Web roadmap — four features

Plans, in implementation order:

| # | Plan | Web effort | Backend effort | Depends on |
|---|---|---|---|---|
| 0 | [Foundation](#phase-0--foundation-do-first) (router, data layer, tests, CI) | 3–4 d | 0.5 d | — |
| 1 | [Shareable links, card pages, "see also"](01-shareable-links-card-pages.md) | 5–6 d | 2–3 d | 0 |
| 2 | [Instant search: highlighting + filters](02-instant-search.md) | 6–8 d | 5–6 d | 0, 1 |
| 3 | [Semantic, cross-language search](03-semantic-search.md) (free/local, per D3) | 3–4 d | 8–10 d | 2 (BR-1/2/9 first) |
| 4 | [Guided journeys](04-guided-journeys.md) | 9–11 d | 4–5 d + **content** | 0, 1 |

Estimates are **developer-days for one engineer, ±40 %**, excluding review waits. Journey
**content authoring and verification dominates Plan 4** and is wall-clock, not engineering time.
Rough total: 14–16 calendar weeks for one person; ~10–11 weeks if backend, web and content run in
parallel (see [Schedule](#schedule)). Backend work is tracked in
[../BACKEND-REQUESTS.md](../BACKEND-REQUESTS.md) and lands in the **KnowledgeBase** repo.

## Verified starting point (2026-11-15)

Facts below were checked against the code and the live database, not assumed.

**Web app** — ~1,300 lines of React in one screen: `App.tsx` (476 lines) holds all state in
`useState`; **no router** (the back button leaves the app, no card has a URL); search is a
250 ms-debounced call returning a flat list of ≤ 50 cards with no highlighting, no pagination UI,
no filters besides topic; `SearchBar`, `CardItem`, `FaqItem`, `TopicGrid`, `Login`, `LocaleSwitcher`;
5 UI locales. No tests, no CI.

**Backend / data** (424 cards, 279 public+active, 1,802 card translations, 90 questions with 371
phrasings, 5 locales — `pt` covers 106 cards only):

- **Search ANDs its synonym expansion.** `kb_expand_query('cedula')` returns
  `cedula DNIC cedula cédula …` and `websearch_to_tsquery` turns that into
  `'cedula' & 'dnic' & 'cedula' & 'cédula'…`. Aliases therefore *narrow* matches instead of widening
  them; cards that lack every form fall through to the trigram `rank > 0.10` fallback. This is the most
  likely cause of weak accent-less matches (`cedula` vs `cédula`, POLISH item I) and is fixed first
  (BR-1) because every search plan builds on it.
- **No accent-insensitive matching** (no `unaccent` anywhere in the migrations).
- **Card-to-card relations exist in the dataset but are not ingested.** `related_card_ids`: all 271
  vendor cards (3,334 edges) and all 69 editorial cards (191 edges, 10 cross-topic). But for **196 of 271
  vendor cards the list is simply the whole topic** (noise). `prerequisite_card_ids`: 228 vendor edges that
  all point at the topic overview (a star, not a sequence) + 19 editorial. `see_also_card_ids`: empty.
- **Corpus is small**: public bodies average ~750 characters (p95 ≈ 1.3 k, max ≈ 8.7 k). One embedding per
  card-and-locale (~1.8 k vectors) is enough and needs **no vector index** — an exact scan is milliseconds.
- **Facets are available**: `content_category` (faq 90, reference 65, overview 24, advice 23, warning 23,
  checklist 21, community_experience 20, instruction 12, resource_list 1), `topic_id` (39 topics incl. 19
  FAQ topics), `sensitivity_tags`, `staleness_risk`.
- **Step-level content is thin outside residency.** Most topics have overview / checklist / advice / warning /
  community cards; real `instruction` / `reference` step cards exist mostly for residency, taxes, banking,
  renting and buying. Journeys will need short authored step text, not just links.
- `GET /cards/:id` is **not scope-filtered** (fine for signed-in users; unsafe to reuse for any public page).
- The Edge Function is unauthenticated-CORS-open (`Access-Control-Allow-Origin: *`) and every request makes
  three sequential round trips (`auth.getUser` → `profiles` lookup → RPC) — relevant to "instant".
- Whether the `pt`-aware Edge Function was ever deployed is **unknown** (backend changelog says "not yet").

## Decisions (owner: product)

Resolved 2026-11-15:

| ID | Decision | Consequence for the plans |
|---|---|---|
| D1 | **Public pages, no login required "for now".** Read access to public+active content needs no sign-in; sign-in stays for the account locale and the internal/unreviewed toggle. | Plan 1 §9 (public card pages) is **in scope**, not optional; BR-13 becomes P1 and is a **prerequisite** for Plans 1, 2 and 4 (they must work signed-out). Public endpoints are hard-filtered in SQL and rate-limited. Reassess before any real launch. |
| D2 | **`localhost` until told otherwise.** No hosting yet. | Share links only work on the same machine for now; link previews, SEO, `sitemap.xml`, SPA-rewrite config and CORS lock-down (BR-14) are **deferred**. Keep URLs host-agnostic. |
| D3 | **No paid APIs at this stage.** | Plan 3 is rewritten around free, local options (cross-locale lexical search first, then an open-weights embedding model run locally). No third party ever sees query text. |
| D4 | **Journey answers/progress stay on the device.** | Confirmed Plan 4 default; account sync (BR-12b) is dropped from the roadmap. |

Still open:

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| D5 | Router + data-fetching library | `react-router` (data router) + `@tanstack/react-query`. Both are mainstream, small, and solve URL state, cancellation and caching that Plans 1–2 need. | Phase 0 |

## Phase 0 — Foundation (do first)

Everything else assumes these; skipping them makes each plan pay the cost separately.

1. **Router skeleton** — add `react-router-dom`; split `App.tsx` into route components behind an
   `AppLayout`, with **no behaviour change** (same screens, now at URLs). Detailed route table is in Plan 1.
2. **Data layer** — add `@tanstack/react-query`; wrap `lib/api.ts` calls in hooks whose query keys include
   `locale` and `internal`; pass `AbortSignal` into `fetch`; `placeholderData: keepPreviousData` for search.
3. **Test harness** — Vitest + React Testing Library (unit/component), **MSW** for a mock API fed by small
   fixtures, Playwright for 3–5 smoke journeys. Fixtures must be synthetic or taken from public cards only.
4. **CI** (GitHub Actions): `npm ci` → `tsc` → `vitest run` → `vite build` → (nightly) Playwright. Build runs
   with dummy `VITE_*` values; **no secrets in CI** (the app has none).
5. **Quality gates**: ESLint + `eslint-plugin-jsx-a11y`, `axe-core` in component tests, bundle-size report.
6. **Env hygiene**: keep `.env*` ignored; add a CI step that fails if `dist/` or `.env` is tracked.
7. **API contract file** (`docs/API-CONTRACT.md`) kept in sync as endpoints change.

**Exit criteria:** app behaves as before; every screen has a URL; CI green; first Playwright smoke passes
against the mock API.

## Schedule

Assumes one web engineer, one backend engineer (can be the same person), and a domain reviewer for
journey content. Weeks are calendar weeks.

| Week | Web | Backend | Content / research |
|---|---|---|---|
| 1 | Phase 0 | **BR-0** (link CLI, deploy `kb`); **BR-1** OR-expansion fix; **BR-2** unaccent | Start gold search eval set (BR-9); outline Journey 1 |
| 2 | Plan 1 (router, card page) | BR-6 card_links, BR-7 aliases | Author Journey 1 steps (RU) |
| 3 | Plan 1 (see-also, share), Plan 2 (palette) | BR-3 snippets, BR-4 filters/facets | Eval harness running on lexical baseline |
| 4–5 | Plan 2 (results page, facets, a11y) | BR-5 latency; BR-10 embeddings (schema + pipeline) | Journey 1 review; translate |
| 6–7 | Plan 3 web bits | BR-10 hybrid RPC + edge mode; BR-11 neighbours | Tune on eval set; bake-off decision (D3) |
| 7–9 | Plan 4 engine + UI | BR-12 journeys schema/apply/endpoints | Journeys 2–3 |
| 10 | Hardening: a11y audit, perf budget, docs | Rate limits, BR-14 CORS lock-down | Beta with a few users |

Quick wins that can ship in week 1 regardless of the rest: BR-1 and BR-2 (search quality), BR-0.

## Cross-cutting rules

- **Locale-independent URLs for content**: card/topic/journey slugs carry no language; the language is a
  path prefix, so the same link works in every locale.
- **Never trust the requested locale**: the API falls back to `en` per row; show a small "shown in English"
  note when `locale` differs from the requested one (needs a `locale_used` field — add with BR-6).
- **No raw HTML from the API**: highlights use private-use delimiter characters rendered as React nodes;
  card bodies stay plain text. Do not introduce `dangerouslySetInnerHTML`.
- **Trust signals stay visible**: `needs_review`, `staleness_risk`, `last_updated` must appear wherever a card
  body is shown (card page, search preview, journey step).
- **Privacy**: no analytics SDKs; any future telemetry goes through a first-party endpoint, stores no raw
  queries tied to a user, and is documented here first.
- **Accessibility target**: WCAG 2.2 AA for new screens; keyboard-only operation for search and journeys.
- **Performance budget**: initial JS ≤ 150 kB gzip (today ≈ 111 kB); search palette and journeys are
  lazy-loaded routes; p95 search latency targets are in Plan 2.

## Definition of done (every plan)

Types + lint + unit tests pass in CI · accessibility checks pass · five locales have strings (EN fallback is
acceptable only for `pt` content, never for missing UI keys) · `docs/API-CONTRACT.md` and CHANGELOG updated ·
backend requests merged and **deployed** (a merged migration that isn't applied is not done) · manual smoke
on a phone-sized viewport.

## Top risks

| Risk | Impact | Mitigation |
|---|---|---|
| D1 makes content readable without an account | scraping, load, wrong-audience reading of `needs_review` cards | public endpoints filter public+active in SQL, cache + rate-limit, standing "community-derived, may be outdated" notice, no user data in responses |
| Edge Function not redeployable (CLI unlinked) | `pt` broken today; every API change blocked | BR-0 in week 1; deploy from CI |
| Synonym/search changes regress relevance | worse search | BR-9 eval set gates every search change |
| Embedding provider outage or key abuse via open sign-up | broken or costly search | lexical fallback, query-embedding cache, per-user rate limit |
| Full-replace deploys rename/delete card IDs | dead shared links | stable-ID policy + `card_aliases` (BR-7) + friendly 404 |
| Journey content is wrong or stale | users act on bad legal/admin advice | cards keep review/staleness badges; each step carries a source and a reviewed-at date; start with one journey |
| Scope creep in Plan 4 | schedule | v1 = one journey, local-only progress, no deadlines/reminders |
