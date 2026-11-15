# Plan 1 — Shareable links, a page per card, "see also"

**Goal:** every topic, card, search and Q&A answer has a stable, copy-pasteable URL that opens exactly
that thing, in any language, survives reload, and works with the browser's back button. Each card gets a
full page with trust signals, related context and "see also" navigation.

**Why first:** Plans 2 and 4 both need routes (search state in the URL, journey steps as deep links), and
the community's main distribution channel is a chat where people paste links to answers.

> **Decisions (2026-11-15):** **D1 = public pages without login "for now"** → §9 is **in scope** and §4 (auth) changes:
> content routes are **not** wrapped in `RequireAuth`; only account features (locale default, internal toggle,
> future opt-ins) prompt for sign-in. **D2 = `localhost`** → no hosting config yet; share links only resolve on this
> machine; OG previews, `sitemap.xml`/`hreflang` and the CORS lock-down are deferred. Keep every URL host-agnostic
> (relative links, no hard-coded origin). `internal=1` content stays signed-in only.

## 1. Current state (verified)

- No router; all view state is in `App.tsx` `useState`; no URL changes when you open a topic or search.
- `FaqItem` is an accordion; there is no way to link to one answer. `CardItem` shows a truncated body with a
  lazy "related info" panel; there is no single-card view.
- `GET /cards/:id` already returns title, body, keywords, subtopics, glossary, entities, resources — enough
  for a card page. It returns **no links to other cards**.
- Dataset has card relations that are never ingested (details in `README.md`): `related_card_ids` is noise
  for 196/271 vendor cards (whole-topic lists), curated for the 69 editorial cards; `prerequisite_card_ids`
  is a star to the topic overview; `see_also_card_ids` is empty. **A naive "show related_card_ids" would
  show every card in the topic.** See-also therefore needs filtering plus semantic neighbours (Plan 3).
- Card IDs contain dots (`card.residency_cedula_immigration.reference.ref_permiso_reingreso`, even
  `…advice.40`).

## 2. Scope

In: routing, URL scheme, slug codec, auth return-to-link, card page, share button, FAQ deep links,
see-also + topic prev/next, 404 handling, backend link data.
Out: public (logged-out) pages and link previews (Decision D1 — designed in §9, built only if approved),
search UI (Plan 2), journeys (Plan 4).

## 3. URL scheme

Language is a **path prefix**; slugs are language-independent so one link serves every locale.

| Path | Screen |
|---|---|
| `/` | redirect → `/{lang}` (lang: stored choice → account default → browser language → `ru`) |
| `/:lang` | Knowledge-base home (topic grid) |
| `/:lang/topics/:topicSlug` | topic page (card list; `?cat=` optional filter) |
| `/:lang/faq` · `/:lang/faq/topics/:topicSlug` | Q&A home (most asked) · Q&A topic |
| `/:lang/c/:cardSlug` | **card page** (KB cards and FAQ answers alike) |
| `/:lang/search?q=…` | search results (filled in by Plan 2; stub now) |
| `/:lang/journeys[/:id[/steps/:stepId]]` | reserved for Plan 4 |
| `/login?next=/ru/c/…` | sign-in, returns to `next` |

Rules: `:lang ∈ ru|en|es|de|pt`; unknown prefix → treated as a path without a language and redirected;
the locale switcher swaps the prefix and keeps the rest; `internal` is a **user preference**, not part of
shared URLs.

### Slug codec (`src/lib/slug.ts`)

- `topic.residency_cedula_immigration` → `residency_cedula_immigration` (drop `topic.`).
- `card.residency_cedula_immigration.reference.ref_permiso_reingreso`
  → `residency_cedula_immigration~reference~ref_permiso_reingreso` (drop `card.`, `.` → `~`).
  `~` is an RFC 3986 unreserved character and does not occur in IDs. Dots are avoided because many SPA servers
  and CDNs treat a final path segment containing `.` as a static file and skip the rewrite to `index.html`.
- `decodeCardSlug` reverses it; invalid input returns `null` (→ 404 page), never throws.
- Property tests: round-trip for every ID in a fixture of ≥ 50 real IDs (including `advice.40`, `faq_*`
  IDs with zero-padded `qNN`); rejects slugs with `/`, `..`, whitespace.

## 4. Auth and deep links

- `RequireAuth` wraps all app routes. Signed-out → `/login?next=<encoded current path+search>`; after
  sign-in/sign-up, navigate to `next`.
- **Open-redirect guard (security):** accept `next` only if it starts with a single `/`, does not start with
  `//` or `/\`, and parses to the same origin; otherwise go home. Unit-test the guard with hostile inputs
  (`//evil.com`, `/\evil.com`, `https://evil.com`, `javascript:…`, encoded variants).
- Supabase Auth must allow the deployed origin (site URL / redirect URLs in the Supabase project config —
  see BR-14); email-confirmation links should land back on the app and then follow `next` (store `next` in
  `sessionStorage` before sign-up, since the confirmation click opens a new tab).
- Session loading shows a spinner, never flashes the login form for a signed-in user.

## 5. Card page

Layout (mobile-first, single column; ≥ md adds a right rail for related context):

1. **Breadcrumb**: Topic › (Subtopic) › Card; each crumb is a link. `<nav aria-label>`.
2. **Header**: title (`<h1>`), badges (type / category, needs-review, staleness, low-evidence — reuse
   `Badges.tsx`), "Updated <date>" and `locale_used` note if the API fell back to English.
3. **Actions**: **Share** (see §7), "Open in topic", language switcher stays in the header.
4. **Body**: full text (plain text, `whitespace-pre-line`, bullets "•" preserved), never truncated.
5. **Trust box**: "Based on community chat discussion; may be outdated. Check official sources." +
   official resources (already returned by `getCard`).
6. **Related context**: glossary terms, entities (extract today's panel from `CardItem` into
   `RelatedPanel`, shown expanded here).
7. **See also** (§6) and **More in this topic** (previous / next card in topic order).
8. For FAQ answers: heading is the *question*; shows "Related questions" (same-topic questions by
   `ask_frequency`) and, when available, "Read more in the knowledge base".

`document.title` = `<card title> — <app title>`; `<html lang>` follows the locale. Focus moves to `<h1>` on
route change (announce navigation to screen readers).

Cards in list views (`CardItem`, `FaqItem`, search results) get: title as `<Link>`, a small "link" icon that
copies the permalink, and — for `FaqItem` — `?open=1`/hash deep-link support (opens expanded when arriving
at `/faq/topics/x#q08_permiso_reingreso`; this is only a convenience, the canonical link is the card page).

## 6. "See also"

### Data design (backend, BR-6/BR-8/BR-11)

New table `card_links(card_id, target_card_id, kind, position)` with `kind ∈ prerequisite | related |
see_also | semantic`, both FKs `on delete cascade`, RLS on and direct access revoked like every other table
(extend the `0004` lock-down loop).

Ingest rules in `deploy.mjs` (decided from the measured data):

| Source | Rule |
|---|---|
| vendor `related_card_ids` | **drop the whole list when it covers ≥ (topic size − 1)** — i.e. it is just "everything in the topic" (196/271). Keep the rest (≈ 75 cards). |
| editorial `related_card_ids` (69 cards, 191 edges) | keep all (hand-authored; 10 cross-topic) |
| `prerequisite_card_ids` | keep; the web shows non-overview prerequisites as "Read first", and the overview as the breadcrumb/"Start here" link |
| `see_also_card_ids` | keep (empty today; the field for hand curation) |
| `semantic` | computed in SQL after embeddings exist (Plan 3 / BR-11): top 6 nearest cards by RU embedding, preferring other topics, excluding same-topic siblings and existing links |
| FAQ answers | add `related_card_ids` to `faq.json` answers pointing at the KB reference/instruction cards they summarize (BR-8; ~90 answers; semi-automatic from neighbours, then reviewed) |

Validation at deploy: every target exists; no self-links; ≤ 12 links per card; link target must be
public+active when the source is (otherwise dropped for public scope at read time).

### API

Extend `get_card` / `GET /cards/:id` with a scope parameter (`internal`, default false) and:

```jsonc
"links": {
  "prerequisites": [{ "card_id": "…", "title": "…", "topic_title": "…", "card_type": "…" }],
  "see_also":      [{ "card_id": "…", "title": "…", "topic_title": "…", "kind": "related|see_also|semantic", "card_type": "…" }]
},
"locale_used": "en"        // actual locale of the returned text
```

Targets are resolved with the same per-row English fallback as everything else and filtered by scope.
**Display order:** prerequisites → curated (`see_also`, then `related`) → `semantic` fill, de-duplicated,
max 6 items, each with its topic as a subtle label.

### Stable IDs (BR-7)

A full-replace deploy can rename or delete cards, which kills shared links. Policy: IDs are never reused for
different content. When a card is renamed, add `old_id → new_id` to a hand-maintained `card_aliases` table;
`get_card` returns `{ "redirect_to": "<new id>" }` and the web replaces the URL. A truly removed card shows a
friendly 404 with the topic link and a search box prefilled with the slug's words.

## 7. Sharing

- `ShareButton`: uses `navigator.share({ title, url })` when available (phones), otherwise
  `navigator.clipboard.writeText(url)` and an inline "Link copied" confirmation (`role="status"`). Falls back
  to selecting a read-only input if the clipboard API is unavailable (non-secure context).
- Shared URL = canonical `/{lang}/c/{slug}` with the **current UI language**; no query params, no tokens, no
  user identifiers.
- Because the app requires sign-in today, the recipient lands on the login screen first and is returned to the
  card afterwards (§4). Say so in the share dialog only if it proves confusing in testing.
- Link previews (Open Graph) cannot work for a client-rendered SPA, and cannot show gated content anyway; the
  static `index.html` gets generic OG tags only.

## 8. Implementation tasks (web)

Order matters; each step ships behind the previous screen still working.

1. Phase 0 (router skeleton + query layer) — prerequisite.
2. `src/lib/slug.ts`, `src/lib/routes.ts` (typed builders `cardPath(lang, id)`, `topicPath`, `searchPath`,
   `faqTopicPath`; parse helpers) + unit tests.
3. `RequireAuth`, `safeNext()` guard, login page honouring `next`; tests.
4. Route components: `HomeRoute`, `TopicRoute`, `FaqHomeRoute`, `FaqTopicRoute`, `CardRoute`,
   `SearchRoute` (stub using today's search), `NotFoundRoute`. Move data loading into per-route hooks
   (`useTopics`, `useTopicCards`, `useCard`, `useQuestions`).
5. `useLocale` becomes URL-driven (`:lang`), still persisting to `localStorage` and the profile; locale switch =
   `navigate(swapLang(location, next))`. Redirect from `/`.
6. `CardPage` + `RelatedPanel` (extracted) + `Breadcrumb` + `TopicNeighbors` + `ShareButton` + `SeeAlso`.
7. Convert `CardItem` / `FaqItem` / `TopicGrid` to links (`<Link>` semantics: middle-click and "open in new
   tab" work); add permalink icon.
8. Scroll restoration and focus management on navigation; `useDocumentTitle`.
9. SPA hosting config for the chosen host (D2): a catch-all rewrite to `index.html` (e.g. `public/_redirects`
   `/*  /index.html  200` for Netlify/Cloudflare Pages, or `vercel.json` rewrites).
10. i18n: new keys in all 5 dictionaries — `copyLink`, `linkCopied`, `share`, `seeAlso`, `readFirst`,
    `moreInTopic`, `previousCard`, `nextCard`, `cardNotFound`, `cardNotFoundHint`, `shownInEnglish`,
    `startHere`, `relatedQuestions`, `readMoreInKb`.
11. Docs: update `API-CONTRACT.md`, README routes table, CHANGELOG.

## 9. Phase 1b — public card pages (**approved by D1; build with Plan 1**)

Why: the content is distilled from public chat; sharing a link that opens a login wall hurts adoption. With D2 =
localhost, only the open-endpoint half applies now; previews/SEO items below wait for hosting.

Design (BR-13 becomes P1 and ships before the web routes that need it):

- New open endpoint `GET /public/cards/:id` and `GET /public/topics` in the Edge Function that call **new**
  SQL functions hard-filtered to `visibility='public' AND status='active'`; never reuse `get_card` (it has no
  scope filter). Exclude cards whose `sensitivity_tags` contain anything the owner deems non-public.
- Abuse controls: response caching headers, per-IP rate limit at the edge/CDN, no search over the public
  endpoint (or a heavily limited one), and no user data in responses.
- Legal/product: every public page carries the "community-derived, may be outdated, not legal advice"
  notice; decide whether `needs_review` cards are shown publicly at all.
- Link previews/SEO need server-rendered HTML: either a small prerender step at build time (cards are static
  between deploys — generate `/:lang/c/*.html` with titles/descriptions/OG tags) or an Edge/Worker function
  that returns the shell with injected `<title>`/OG tags. Build-time prerender is simpler because data changes
  only on dataset deploys.
- Add `hreflang` alternates for the 5 locales and a `sitemap.xml` generated from public card IDs.

## 10. Testing

- **Unit:** slug round-trip + hostile inputs; `safeNext`; route builders; `swapLang`; link-ordering/dedupe
  helper for see-also; `redirect_to` handling.
- **Component (RTL + MSW):** card page renders all sections incl. missing optional ones (no resources, no
  see-also); share button both code paths (mock `navigator.share`/clipboard); 404; `locale_used` banner.
- **E2E (Playwright, mock API):** deep link while signed out → login → lands on the card; back/forward
  restores previous screens; locale switch keeps slug; FAQ permalink opens the answer; mobile viewport.
- **a11y:** axe on card page and topic page; keyboard order; focus on `<h1>` after navigation.

## 11. Acceptance criteria

- Pasting `/{lang}/c/{slug}` into a fresh browser: after sign-in the exact card shows; reload keeps it.
- Back/forward behave like a normal site across home → topic → card → search.
- Same card slug opened with each of the 5 language prefixes shows localized text with the right `<html lang>`.
- A renamed card's old link redirects; a removed card shows the friendly 404.
- Cards from vendor topics no longer show "everything in the topic" as see-also; see-also is ≤ 6 relevant items.
- `next` redirect guard passes the hostile-input tests.
- Lighthouse a11y ≥ 95 on the card page; no new axe violations.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Whole-topic `related_card_ids` shown as "see also" | filter rule above + eval by spot-checking 20 cards per topic |
| Dead links after dataset deploys | alias table + friendly 404 + never reuse IDs |
| Email-confirmation flow loses `next` | stash `next` in `sessionStorage` before sign-up |
| Hosting without SPA rewrite → 404 on reload | D2 early; Playwright test on the production build via `vite preview` |
| `locale_used` requires a backend change | ship it with BR-6; until then hide the note |

## 13. Estimate

Web 5–6 d (router/route split is the bulk; card page 1.5 d; share + guards + tests 1.5 d). Backend 2–3 d
(BR-6 table + ingest + `get_card`, BR-7 aliases, BR-8 FAQ relations ≈ 0.5 d plus ~0.5 d review). Public pages
(§9) would add 4–6 d.
