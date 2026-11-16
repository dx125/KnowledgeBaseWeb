# Development guide

How this codebase is put together and how to extend it without breaking what works. Written after the
Phase 0 foundation (2026-11-16); the roadmap is in [plans/README.md](plans/README.md), the API in
[API-CONTRACT.md](API-CONTRACT.md).

## 1. Everyday workflow

```bash
npm ci
npm run dev:mock        # app on http://localhost:5173 against the in-browser mock (no backend)
npm run test:watch      # Vitest in watch mode
```

Before pushing, run what CI runs (`.github/workflows/ci.yml`):

| Check | Command | Fails when |
|---|---|---|
| Types | `npm run typecheck` | `tsc` errors in the app, tests or tool configs |
| Lint | `npm run lint` | any ESLint error **or warning** |
| Tests | `npm run test:coverage` | a test fails, or coverage drops below the thresholds in `vitest.config.ts` |
| Build | `npm run build` (+ `build:mock`) | type or bundling errors |
| Budget | `npm run size` | the first screen's JS exceeds 150 kB gzip (decision D9) |
| Browser | `npm run e2e` | a Playwright journey fails, incl. axe accessibility scans (first time: `npx playwright install chromium`) |

A feature is done when these pass and the roadmap's "Definition of done" holds (5 locales of UI strings,
`API-CONTRACT.md`, mock and CHANGELOG updated, phone-sized manual check).

## 2. How the app is put together

```
main.tsx      start the mock (mock mode only) → createAppRouter() → <App router>
App.tsx       QueryClientProvider → AuthProvider → PreferencesProvider → RouterProvider
app/routes.tsx
  RootLayout (ScrollRestoration; errorElement RouteError; HydrateFallback BootSpinner)
  ├─ /                RootRedirect → /{last language}
  └─ /:lang           LangRoute       language from the URL (invalid prefix → redirect)
       SessionGate                    config check → session → login in place → profile → account language (D6)
         AppLayout                    header, section tabs, internal toggle, footer
           index · topics/:topicSlug · faq · faq/topics/:topicSlug · *   ← lazy screens in src/routes/
```

| Concern | Where | Rule |
|---|---|---|
| URLs | `src/lib/paths.ts` | the **only** place paths are built or parsed; never write `'/' + lang + …` in components |
| Language | `src/app/locale.tsx` | `useLocale()` = the page's language (from the URL); switch only via `useSwitchLocale()` |
| Section (KB / Q&A) | route `handle` → `useSection()` (`src/app/AppLayout.tsx`) | screens serve both sections; no `mode` props |
| Internal toggle | `src/app/preferences.tsx` | `usePreferences()`; `useScope()` = `{ locale, includeInternal }` for query params |
| HTTP | `src/lib/api.ts` | typed wrappers; every `GET` takes `signal`; errors are `ApiError` |
| Server state | `src/data/` | keys in `keys.ts`, `queryOptions` + hooks in `queries.ts`, defaults in `queryClient.ts` |
| Auth | `src/auth/AuthProvider.tsx`, `src/lib/auth.ts` | `useAuth()`; `@supabase/auth-js` only |
| UI strings | `src/i18n.ts` | `t(locale, key)`; content text comes from the API, never from here |

## 3. Recipes

### Add a screen (route)

1. **Path:** add a builder (and parser if needed) to `src/lib/paths.ts`, with unit tests in `paths.test.ts`.
   Slugs carry no language; the language is always the first path segment.
2. **Route:** add it under `AppLayout` in `src/app/routes.tsx` with `lazy: () => import('../routes/X').then((m) =>
   ({ Component: m.X }))`, and a `handle` (`{ mode: 'faq' }` for Q&A routes, `sectionHome: true` for a section home).
3. **Component** in `src/routes/`: read `useLocale()`, `useScope()`, `useSection()`, `useParams()`. Invalid or
   unknown ids render `<NotFound mode={mode} />` — never throw.
4. **Links** are `<Link to={somePath(locale, …)}>` (real anchors: middle-click and "open in new tab" work). Search
   text and filters live in the query string; copy the push-then-replace rule from `src/routes/useSearchQuery.ts`
   and pass `preventScrollReset: true` when only the query string changes.
5. **Tests:** URLs, Back/Forward, deep link and reload in `src/app/routing.test.tsx`; a journey in
   `e2e/navigation.spec.ts`; the screen in each of its states in `src/app/a11y.test.tsx` **and**
   `e2e/a11y.spec.ts` (axe must report nothing). Run `npm run size` — a new screen must not grow the first load.

### Add an API call

1. `src/lib/api.ts`: response types + a wrapper using `apiGet(path, params, signal)`; empty params are dropped.
2. **Mock:** the route in `src/mocks/api.ts` (+ synthetic fixtures in `src/mocks/fixtures/`). Tests, `dev:mock`
   and Playwright all run against it — an endpoint the mock doesn't serve answers `404 not_found` there (requests
   that no mock handler matches at all — e.g. another host — fail tests as unhandled).
3. **Key:** add to `kbKeys` in `src/data/keys.ts`. Content keys **must** include `locale` and `includeInternal`
   (extend `ScopeParams`); keep everything under `['kb']`.
4. **Hook:** a `xQuery(params)` factory with `queryOptions({ queryKey, queryFn: ({ signal }) => call(…, signal) })`
   and a `useX(params, { enabled })` hook in `src/data/queries.ts`. Forwarding `signal` is what makes cancellation
   and stale-response protection work.
5. **Docs:** a row in `docs/API-CONTRACT.md`.
6. **Tests:** wrapper params/envelope in `src/lib/api.test.ts`; caching/keys/races in `src/data/queries.test.tsx`.

### Change server data (mutations)

Follow `useSaveDefaultLocale`: update the cache **synchronously** with `setQueryData` before sending (any render
after that reads the new value), don't write a possibly older server reply back, and decide explicitly what a
failed request means for the UI. Don't trigger fetches from `useEffect`; derive from query data instead.

### Loading, errors, empty states

Use `Spinner`, `ErrorBox` (with `errorMessage(error)`) and `EmptyState` from `src/components/Feedback.tsx`. Show
the spinner for `isPending` (no data for the current key yet); cached data renders immediately. Today a new search
shows the spinner rather than the previous results (D7).

### UI strings

Add the key to the `StringKey` union **and** all five dictionaries in `src/i18n.ts` (`Record<StringKey, string>`
makes a missing translation a type error). English is the runtime fallback only for unknown locales.

### Heavy features

Anything large or rarely used (search palette, journeys, an in-browser model) is a lazy route or `React.lazy`
component (see `Login` in `src/app/guards.tsx`) and must not appear in `npm run size`'s first-load list.
Check the script's output in the PR.

## 4. Testing

| Layer | Where | Tools |
|---|---|---|
| Unit | next to the code (`*.test.ts`) | Vitest |
| Hooks / components | next to the code (`*.test.tsx`) | React Testing Library, MSW |
| Whole app | `src/App.test.tsx` (behaviour contract), `src/app/*.test.tsx` (routing, guards, config) | RTL + MSW + the real router |
| Browser | `e2e/*.spec.ts` | Playwright, Chromium desktop + phone, mock-mode production build in `dist-e2e/` |

Helpers (`src/test/`):

- `renderApp(url)` renders the whole app at a URL with its own router; returns `{ user, router, … }`.
- `signIn(user, { email?, locale? })` fills in the login form. `newEmail()` gives a fresh account per test
  (the mock keys stored profiles by email).
- `signInDirect()` signs in without UI (for hook/component tests); `createTestQueryClient()` is the app's
  client config without retries; `withQueryClient(client)` is a wrapper for `renderHook`.
- `recordApiRequests()` returns the list of KB API requests seen during the test.
- `server.use(http.get(api('/path'), …))` overrides one route for one test (`api()` / `authUrl()` build mock URLs).
- `topicTitle()`, `cardText()`, `questionText()` read fixture text, so tests don't hard-code content.
- `expectNoAxeViolations(container?, { component? })` (`src/test/axe.ts`) runs axe-core in jsdom; `component: true`
  skips page-level rules (landmarks, heading order) for a component rendered alone. In Playwright,
  `expectNoA11yViolations(page)` (`e2e/helpers.ts`) does the same in Chromium.

Accessibility is checked twice, because each environment sees different things:

| Where | Sees | Misses |
|---|---|---|
| jsdom (`src/app/a11y.test.tsx`, component tests) | names, roles, ARIA, landmarks, headings, form labels — fast, every state | colour contrast (no layout or computed colours) |
| Chromium (`e2e/a11y.spec.ts`, desktop + phone) | everything above **plus colour contrast** on the real styles | states that are hard to reach in the browser |

Both use WCAG 2.0/2.1/2.2 A + AA and axe best practices, and require zero violations. axe finds only part of
the problems: keyboard order, focus after navigation and screen-reader announcements still need a manual check.

Rules that keep the suite reliable:

- Find elements by role, label or text, using `t(locale, key)` for UI strings and the fixture helpers for content.
- The router updates `window.location` **before** React renders the new location: after waiting for a URL,
  assert on the UI with `findBy*` / `waitFor`, not `getBy*`.
- The mock answers instantly in tests; a test that needs a slow response adds its own handler with `delay()`.
- `src/test/setup.ts` clears storage, resets the URL and handler overrides after every test; async queries wait up
  to 3 s (`asyncUtilTimeout`) for loaded CI machines.
- Tests run in `src/test/jsdom-environment.ts`: stock jsdom, but with Node's own `AbortController`/`AbortSignal`
  (Node's `fetch` rejects jsdom's signals since Node 24), so the suite passes on Node 22 (CI) and 24 alike.
- `src/App.test.tsx` is the no-regression contract from before the refactor: add tests, but change an
  existing assertion only for an intended behaviour change, and say so in the CHANGELOG.

## 5. Rules worth repeating

- **No raw HTML** from the API: `dangerouslySetInnerHTML` is a lint error. Build React nodes.
- **Trust signals stay visible** wherever a card body is shown (`needs_review`, staleness, last updated).
- **Contrast:** secondary text is `text-slate-500` at least (`text-slate-600` on tinted cards); `slate-400` and
  lighter only for decoration (icons hidden with `aria-hidden`, borders). Every page has `<main>`; heading levels
  don't skip; inputs have a label or `aria-label`, not just a placeholder.
- **Everything in `VITE_*` is public.** No secrets in the repo, the bundle or CI. The mock build contains the
  fixtures and is never deployed; e2e builds go to `dist-e2e/`, never `dist/`.
- **`internal` is a preference, not a URL parameter**, and is never part of shared links.
- **Signed in, the account language wins** (D6): never set the language any other way than `useSwitchLocale()`.
- **Line endings:** older files are CRLF, newer ones LF. Keep a file's existing style until the planned
  normalisation commit (see the roadmap follow-ups).
