# Web roadmap — four features

Plans, in implementation order:

| # | Plan | Web effort | Backend effort | Depends on |
|---|---|---|---|---|
| 0 | [Foundation](#phase-0--foundation-done-2026-11-16) (router, data layer, tests, CI) — **✅ done 2026-11-16** | 3–4 d | 0.5 d | — |
| 1 | [Shareable links, card pages, "see also"](01-shareable-links-card-pages.md) | 5–6 d | 2–3 d | 0 |
| 2 | [Instant search: highlighting + filters](02-instant-search.md) | 6–8 d | 5–6 d | 0, 1 |
| 3 | [Semantic, cross-language search](03-semantic-search.md) (free/local, per D3) | 3–4 d | 8–10 d | 2 (BR-1/2/9 first) |
| 4 | [Guided journeys](04-guided-journeys.md) | 9–11 d | 4–5 d + **content** | 0, 1 |

Estimates are **developer-days for one engineer, ±40 %**, excluding review waits. Journey
**content authoring and verification dominates Plan 4** and is wall-clock, not engineering time.
Rough total: 14–16 calendar weeks for one person; ~10–11 weeks if backend, web and content run in
parallel (see [Schedule](#schedule)). Backend work is tracked in
[../BACKEND-REQUESTS.md](../BACKEND-REQUESTS.md) and lands in the **KnowledgeBase** repo.

## Current state of the web app (2026-11-16, after Phase 0)

- **Routing:** react-router 7 data router. Every screen has a URL (`/:lang`, `/:lang/topics/:slug`, `/:lang/faq`,
  `/:lang/faq/topics/:slug`, search text in `?q=`); Back/Forward, reload and deep links work; scroll position is
  restored on Back; unknown paths show a not-found page. Screens are lazy route modules. No card page yet
  (Plan 1). Route table: `src/app/routes.tsx`; URL scheme: `src/lib/paths.ts`.
- **Language** is the URL prefix. Signed in, the account's default language always wins (D6).
- **Data:** `@tanstack/react-query` hooks in `src/data/` (keys include `locale` + `internal`); requests are
  cancelled when no longer needed, stale responses can't overwrite newer ones, 5-minute cache, cleared when the
  signed-in user changes. `src/lib/api.ts` calls take an `AbortSignal` and throw `ApiError`.
- **Auth:** `@supabase/auth-js` only (no database/realtime/storage clients in the bundle). Sign-in is still
  required for all content; the login form is shown in place at the requested URL (no `/login` route yet).
- **Search** is unchanged in behaviour: 250 ms debounce, flat list of ≤ 50 cards (100 inside a topic), spinner
  while loading (D7), separate KB and Q&A searches.
- **Quality:** 117 Vitest tests (unit, component, whole-app, routing, accessibility; MSW runs the `src/mocks`
  handlers in Node), ≈ 99 % line coverage with enforced thresholds; Playwright smoke, navigation and accessibility
  journeys on desktop and phone viewports against a mock-mode build; axe-core (WCAG 2.0–2.2 A/AA + best practices)
  on every screen, in jsdom and in the browser (incl. colour contrast); ESLint (typescript-eslint, react-hooks,
  jsx-a11y); GitHub Actions CI.
- **Initial JS:** 127.5 kB gzip for the signed-in home, 124.7 kB for the login form (budget 150 kB, enforced by
  `npm run size` in CI). Libraries: React 18, react-router 7, react-query 5, auth-js 2.
- How to work in this codebase: [../DEVELOPMENT.md](../DEVELOPMENT.md).

## Verified starting point (2026-11-15)

Facts below were checked against the code and the live database, not assumed. The web-app paragraph describes
the app **before** Phase 0 (kept for the record; see the current state above).

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

Resolved 2026-11-16 (during Phase 0):

| ID | Decision | Consequence for the plans |
|---|---|---|
| D5 | **react-router 7 (data router, `createBrowserRouter`) + `@tanstack/react-query` 5.** The data router was accepted even if it had exceeded the JS budget; it ended up within it (D9). react-router 8 needs React 19 — upgrade together later. | All plans use `src/app/routes.tsx` (lazy route modules) and the `src/data/` conventions. |
| D6 | **Signed in, the account's default language always wins.** The language switcher saves to the account; a URL in another language is redirected to the account language (history *replace*). Signed out, the URL prefix decides. `/` → last language used on the device → `ru`. | Plan 1 §3/§11: a shared link keeps its content (slugs are language-free) but opens in the **recipient's** account language when they are signed in; "same slug in all 5 prefixes shows that language" holds only signed out. Revisit if per-link language matters. |
| D7 | **While a new search loads, show the spinner** (no previous results kept on screen) — for now. | Plan 2 decides whether to switch to `keepPreviousData` as part of "instant" search. |
| D8 | **The internal/unreviewed toggle is kept in memory only** (per session, not in the URL, not saved) — for now. | Plans 1/2: never put `internal` in shared URLs; if it should persist, store it per device. |
| D9 | **Initial-JS budget stays ≤ 150 kB gzip**, measured for the first screen (entry + app shell + first route chunk) and enforced in CI (`npm run size`). | New heavy UI (search palette, journeys, in-browser embedding model) must be lazy chunks outside the first load. |

## Phase 0 — Foundation (done 2026-11-16)

Everything else assumes these; skipping them makes each plan pay the cost separately. Delivered in four
stages (tests first, then data layer, routing, tooling), each green on its own; details in the CHANGELOG.

| # | Item (as planned) | Status | As built / deviations |
|---|---|---|---|
| 1 | **Router skeleton**: split `App.tsx` into route components behind an `AppLayout`, no behaviour change | ✅ | `react-router` 7 (not `react-router-dom`; v7 merged them), data router. `AppLayout` + `HomeRoute` / `TopicRoute` / `NotFoundRoute` as lazy route modules; guards `LangRoute` → `SessionGate`. Routes implemented from Plan 1: `/`, `/:lang`, `/:lang/topics/:slug`, `/:lang/faq`, `/:lang/faq/topics/:slug`; search as `?q=` on those pages (no `/search` yet); no `/c/` card page, no `/login` route (login shown in place). |
| 2 | **Data layer**: react-query hooks, keys with `locale` + `internal`, `AbortSignal`, `keepPreviousData` for search | ✅ | `src/data/` (`keys.ts`, `queries.ts`, `queryClient.ts`). **No `keepPreviousData` for search** (D7: keep today's spinner). Cache cleared when the signed-in user changes. |
| 3 | **Test harness**: Vitest + RTL, MSW with synthetic fixtures, Playwright 3–5 smoke journeys | ✅ | MSW reuses the mock-mode handlers (`src/mocks`, synthetic fixtures) in Node. `src/App.test.tsx` = whole-app behaviour tests written against the pre-refactor app and kept as the no-regression contract. Playwright: 16 journeys (smoke, navigation, accessibility) × desktop + phone, against a mock-mode production build (`dist-e2e/`). |
| 4 | **CI**: `npm ci` → `tsc` → `vitest` → `vite build` → (nightly) Playwright, no secrets | ✅ | `.github/workflows/ci.yml`: typecheck → lint → tests with coverage → build → size → build:mock; Playwright runs on **every** push/PR (≈ 1 min), not nightly. Not yet observed running on GitHub. |
| 5 | **Quality gates**: ESLint + jsx-a11y, `axe-core` in component tests, bundle-size report | ✅ | ESLint 9 (typescript-eslint, react-hooks incl. compiler-era rules, jsx-a11y, ban on `dangerouslySetInnerHTML`), zero warnings. **axe-core** (WCAG 2.0/2.1/2.2 A + AA, best practices) in component tests, on every screen and state of the app in jsdom (`src/app/a11y.test.tsx`), and in the browser on desktop + phone incl. colour contrast (`e2e/a11y.spec.ts`); zero violations required. Bundle size is a **failing check**, not just a report (`npm run size`, D9). Coverage thresholds enforced. |
| 6 | **Env hygiene**: CI fails if `dist/` or `.env` is tracked | ✅ | CI step; `pack.sh` also excludes `dist-e2e/` and Playwright output. |
| 7 | **API contract file** kept in sync | ✅ | `docs/API-CONTRACT.md` updated (client notes, auth endpoints); the mock is part of the contract (tests run against it). |

**Exit criteria** — met: the behaviour tests written before the refactor pass with their original assertions
(tests were only added, and the race test flipped from expected-fail to pass once fixed); 26 of 28 compared
screens (desktop + phone) are pixel-identical to the pre-refactor app, the other 2 differ only by a bug fix
(topic heading now follows a language switch); every screen has a URL; CI green locally; Playwright passes against
the mock API.

**Bugs found and fixed along the way:** a late profile response could switch the language back right after the
user changed it (race); topic heading stayed in the old language; `<html lang>` not set on load; duplicate React
keys in Q&A topics; search-box keystrokes could be dropped while the URL updated; blank page instead of the
"not configured" screen when `.env` is missing. Accessibility (found by axe): grey secondary text below 4.5:1
contrast (card "Updated" dates, footer, related-panel notes — now `slate-500`/`slate-600`, the only visible
change of Phase 0), no `<main>`/landmarks on the login page, a skipped heading level on search results, search
box named only by its placeholder.

### Follow-ups left by Phase 0

| Item | Why it matters | Suggested slot |
|---|---|---|
| Placeholder text (`placeholder:text-slate-400`) is ≈ 2.6:1 | axe does not check placeholders, but WCAG 1.4.3 arguably applies; the boxes also have labels now | with the Plan 2 search UI redesign |
| Keyboard-only and screen-reader walkthrough | axe finds ~⅓ of issues; manual checks cover focus order, announcements | week 10 hardening (a11y audit) |
| Search boxes use `autoFocus` (documented lint exception) | moves screen-reader focus past the page heading | Plan 1 task 8 (focus management) |
| Focus management on navigation, `useDocumentTitle` | screen readers get no page-change cue; tab titles never change | Plan 1 task 8 |
| Upgrades held back: React 19 (→ react-router 8), Vite 6+ (→ Vitest 4+); `@playwright/test` pinned to 1.56 | stay on supported majors | a dedicated upgrade PR, before week 10 hardening |
| Mixed CRLF/LF line endings in the repo | noisy diffs on Windows vs Unix checkouts | one normalisation commit (`.gitattributes`: `* text=auto eol=lf`) |
| CI workflow not yet run on GitHub | the first run may need small fixes (runner, caching) | on the first push |

## Schedule

Assumes one web engineer, one backend engineer (can be the same person), and a domain reviewer for
journey content. Weeks are calendar weeks.

| Week | Web | Backend | Content / research |
|---|---|---|---|
| 1 | Phase 0 ✅ | **BR-0** (link CLI, deploy `kb`); **BR-1** OR-expansion fix; **BR-2** unaccent | Start gold search eval set (BR-9); outline Journey 1 |
| 2 | Plan 1 (card page, slugs; router done in Phase 0) | BR-6 card_links, BR-7 aliases | Author Journey 1 steps (RU) |
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
- **Performance budget**: initial JS ≤ 150 kB gzip for the first screen (today 127.5 kB signed-in home,
  124.7 kB login; `npm run size` fails CI above the budget — D9). Screens are lazy route modules; the search
  palette, journeys and any in-browser model must be lazy chunks too. p95 search latency targets are in Plan 2.

## Definition of done (every plan)

Types + lint + unit tests + Playwright pass in CI · initial-JS budget holds (`npm run size`) · the mock
(`src/mocks`) implements every endpoint the feature uses · accessibility checks pass · five locales have strings (EN fallback is
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
| Bundle creep as features land | slower first load on phones | D9 budget enforced in CI; new screens lazy by default; check `npm run size` output in PRs |
| Mock drifts from the real API | tests pass, production breaks | mock mirrors `API-CONTRACT.md`; every BR that changes an endpoint updates the mock in the same web PR; a periodic manual smoke against the real backend |
