# Web changelog

The web app used to live in the KnowledgeBase (backend) repo under `web/`. This file collects
its history. Entries before 2026-11-15 were reconstructed from the backend repo's git log and
changelogs; dataset/backend details stay in the backend repo's changelogs.

## 2026-11-16 — Phase 0 review fixes
- Removed `src/useAuth.ts` and `src/useLocale.ts`: unused since the move to `src/auth/` and `src/app/locale.tsx`,
  and `useAuth.ts` still imported the removed `@supabase/supabase-js`, so `typecheck` and both builds failed on
  a clean install.
- The Vitest suite now also passes on Node 24 (it failed with "Expected signal to be an instance of AbortSignal"):
  tests run in `src/test/jsdom-environment.ts`, which keeps Node's AbortController/AbortSignal.
- `scripts/pack.sh` leaves the top-level `docs/` folder out of the sandbox upload archive.

## 2026-11-16 — Accessibility checks (axe-core), the last Phase 0 gate
- axe-core (WCAG 2.0/2.1/2.2 A + AA, best practices) runs in jsdom on every screen and state
  (`src/app/a11y.test.tsx`: login/sign-up/error, home, internal toggle, search + empty, topic with read-more and
  related panels, Q&A, not found, another language, API error) and in component tests (`CardItem`, `SearchBar`),
  and in Chromium on desktop + phone incl. colour contrast (`e2e/a11y.spec.ts`). Zero violations required.
- Fixed what it found:
  - **Contrast (visible change):** grey secondary text was ≈ 2.4–2.6:1 — card "Updated" dates now
    `text-slate-600` (≥ 7:1 on every card tint), footer and related-panel notes `text-slate-500` (≥ 4.5:1).
  - Login page: top bar is a `<header>`, the form area a `<main>` (no visual change).
  - Search results: the "N results" line is an `<h2>` styled as before (headings no longer skip a level).
  - Search box: `aria-label` (was named only by its placeholder); the magnifier icon is `aria-hidden`.
- Verified: with the old colours put back, every screen is pixel-identical to the pre-refactor app (except the
  earlier topic-heading fix), so the structural fixes change nothing visually.

## 2026-11-16 — Documentation and roadmap after Phase 0
- New `docs/DEVELOPMENT.md`: how the app is put together, recipes (add a screen, an API call, a mutation, UI
  strings, heavy features), testing helpers and rules, the checks CI runs.
- Roadmap (`docs/plans/README.md`): Phase 0 marked done with per-item status and deviations; current state of
  the app; D5 resolved (react-router 7 data router + react-query) and the Phase 0 decisions recorded as D6–D9
  (account language wins, spinner while searching, in-memory internal toggle, enforced 150 kB budget); budget,
  definition of done, risks and a follow-up list (axe checks, focus management, held-back upgrades, line endings).
- Plan 1 gets task-by-task status (router, URL-driven language, topic URLs done) and the D6 consequences; Plan 2
  builds on the existing `src/data` search hook and URL state; Plans 3–4 note the budget and conventions.
- `docs/API-CONTRACT.md`: hook per endpoint, client behaviour (cancellation, `ApiError`, retries, cache), and the
  Supabase Auth endpoints the app uses; `BACKEND-REQUESTS.md`: endpoint changes update the mock too;
  `POLISH-web.md`: current checks. README: documentation index, roadmap status, layout.

## 2026-11-16 — Back under the 150 kB initial-JS budget
- Auth now uses `@supabase/auth-js` directly instead of `@supabase/supabase-js`. `createClient()`
  also built the database, realtime, storage and functions clients, which the app never uses.
  Same GoTrue client and version, same options and session storage key (existing sessions
  stay signed in). Initial JS 158 → 127.5 kB gzip (signed-in home), 124.7 kB (login form).
- Screens are lazy route modules (`HomeRoute`, `TopicRoute`, `NotFoundRoute`), and the login
  form is a lazy component. Saves ≈ 3 kB of the signed-in first load today; the point is that
  future heavy screens (search palette, journeys) stay out of the first load. A screen
  whose chunk fails to download shows the error page with a reload link.
- `npm run size` (also in CI): fails if the first screen's JS exceeds 150 kB gzip.
- Fixed: with no `.env`, the page stayed blank (`createClient` threw "supabaseUrl is required"
  while loading) instead of showing the "Supabase is not configured" screen.

## 2026-11-16 — Foundation: routing, data layer, tests
- **Routing** (react-router 7 data router): every screen has a URL — `/:lang`,
  `/:lang/topics/:slug`, `/:lang/faq`, `/:lang/faq/topics/:slug`, search in `?q=` (see README
  "Routes"). Back/Forward, reload and shared links work; scroll position is restored on Back;
  unknown paths show a not-found page. Topic tiles, tabs and back links are real links.
- **Language in the URL.** Switching swaps the prefix (history replace) and saves the account
  default; signed in, the account language always wins (other-language links redirect to it).
- **Data layer** (@tanstack/react-query): hooks in `src/data/` replace the hand-written
  `useEffect` loading. Requests are cancelled when no longer needed, late responses can't
  overwrite newer ones, results are cached for 5 min per language/scope, and the cache is
  cleared when the signed-in user changes. `lib/api.ts` calls take an `AbortSignal`; errors
  are `ApiError` (same message text as before).
- **Fixed:** a late profile response could switch the language back right after the user
  changed it (race); the topic heading stayed in the old language after a switch;
  `<html lang>` was not set on load; duplicate React keys in Q&A topics (two questions sharing
  an answer card); search-box keystrokes could be dropped while the previous value was being
  applied; no API calls are made before sign-in. The related-info panel now opens at once
  with a loading line (it used to open only after loading).
- **Tests:** Vitest + React Testing Library + MSW (the mock-mode handlers, run in Node);
  whole-app behaviour tests written against the pre-refactor app and kept unchanged; routing,
  data-layer, component and API-client tests (~99 % line coverage, enforced thresholds).
  Playwright smoke/navigation tests (desktop + phone) against a mock-mode build.
- **Tooling:** ESLint 9 (typescript-eslint, react-hooks, jsx-a11y, no `dangerouslySetInnerHTML`);
  GitHub Actions CI (typecheck, lint, coverage, builds, Playwright; fails on tracked env files
  or build output); scripts `typecheck`, `lint`, `test`, `test:watch`, `test:coverage`, `e2e`.
- Initial JS ≈ 158 kB gzip (was ≈ 112 kB): react-query ≈ +13 kB, react-router data router ≈ +33 kB
  (brought back under budget the same day, see above).

## 2026-11-15 — Mock mode: run and build without a backend
- `npm run dev:mock` / `npm run build:mock` (`vite --mode mock`; dummy values in the committed
  `.env.mock`). MSW (`msw` devDependency, `public/mockServiceWorker.js`) mocks the KB API and
  Supabase Auth in the browser from synthetic fixtures in `src/mocks/`.
- `src/main.tsx` starts the mock before rendering and now imports `App` lazily, so the Supabase
  auth client is only created once the mock is listening. Normal builds drop the mock; `App` is
  now a separate JS chunk (same total size).
- `scripts/pack.sh` builds `../kb-web-upload.zip` for sandbox uploads and fails if env files,
  build output or likely secrets would be included.

## 2026-11-15 — Split into its own repository
- Moved `web/` out of the backend repo with a fresh history (no old commits imported).
- `vite.config.ts` no longer reads a shared root `.env`; the app now has its own `.env`
  (`.env.example`: public `VITE_*` values only) and `.gitignore`.
- Web-only documentation moved here: POLISH items B/A (UI half), web notes from the backend
  changelogs, and the new implementation plans under `docs/plans/`.

## 2026-07-27 — Portuguese (pt-BR) as a 5th UI locale
- `src/i18n.ts`: `pt` added to `SUPPORTED_LOCALES` / `LOCALE_LABELS`, plus a full Brazilian
  Portuguese UI-chrome dictionary. (Dataset side: `pt` content for rent/purchase/locations
  topics, backend v7.9.)
- Note carried over from the backend: `?locale=pt` resolves to `en` at the API layer until the
  Edge Function with `pt` in `SUPPORTED_LOCALES` is deployed (`supabase functions deploy kb`).
  Not verified as deployed at the time of the split.

## 2026-06-24 — Reworked Q&A view
- Global **"Most asked"** list ranked by `ask_frequency` plus per-topic browse, consuming the new
  `GET /questions` endpoint (backend v7.3: normalized questions → answer-cards).

## 2026-06-23 — Q&A (FAQ) section
- New **Q&A web view**: KB | Q&A tab, topic list → question/answer accordion, search
  (`/search?category=faq`; the client also filters to `topic.faq_*` until the Edge Function
  build with `category` is live).

## 2026-06-16 — Related-context panel complete
- Card panel shows official **resources** (public, verified URLs) next to glossary terms and
  entities (POLISH Finding A complete, backend v6.3).

## 2026-06-15 — Initial web app
- Login/signup gate, topic browsing, search (whole base or one topic), locale switcher that
  saves as the account default, toggle for internal/unreviewed cards.
