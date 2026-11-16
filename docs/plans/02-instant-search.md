# Plan 2 — Instant search with highlighting and filters

**Goal:** typing in the search box feels immediate and *shows why* each result matched: a command-palette
style quick search (`Ctrl/Cmd+K`, `/`) for jumping to a card, plus a full results page with highlighted
snippets and filters (topic, type, category) whose state lives in the URL.

**Hard prerequisite:** fix the ranking foundation first (BR-1, BR-2). Highlighting and filters on top of a
query builder that ANDs its synonyms would polish the wrong results.

## 1. Current state (verified; updated 2026-11-16 after Phase 0)

- **Phase 0 already provides:** search text in the URL (`?q=` on `/:lang`, `/:lang/faq` and topic pages; the
  first search adds a history entry, refinements replace it); react-query `useSearch` with request cancellation
  and protection against stale responses (tested in `src/data/queries.test.tsx`); 5-minute cache per
  query + locale + scope; `SearchBar` ignores the echo of its own last value, so URL updates can't drop keystrokes.
  While a new search loads the list is replaced by a spinner (D7).
- `SearchBar` debounces 250 ms and calls `GET /search` (limit 50, or 100 inside a topic). Results are a flat
  list of full `CardItem`s; no snippet, no highlight, no "show more", no filters except "inside this topic"
  and the internal toggle. Q&A and KB searches are separate modes.
- Backend `search_cards`: `websearch_to_tsquery(kb_expand_query(q))` + `ts_rank` + trigram similarity on
  title/short body, × `search_boost`, × alignment factor, with a `rank > 0.10` fallback.
  - **Defect (verified on the live DB):** `kb_expand_query('cedula')` → `cedula DNIC cedula cédula …`,
    and `websearch_to_tsquery` ANDs every word → `'cedula' & 'dnic' & 'cedula' & 'cédula' …`. Synonyms
    narrow the match instead of widening it.
  - No `unaccent`: `cedula` ≠ `cédula` lexemes (POLISH item I).
  - No prefix matching, so nothing matches while a word is half-typed.
- Latency: each request does `auth.getUser` (network) → `profiles` lookup (even though the web always sends
  `locale`) → RPC. Three sequential round trips before any SQL cost; cold starts add more. Not measured yet.
- Facets available in data: `content_category` (reference 65, overview 24, advice 23, warning 23, checklist 21,
  community_experience 20, instruction 12, resource_list 1), 90 FAQ answers (`card_type = 'faq'`), topics (20 KB
  topics + 19 FAQ topics).

## 2. Design decisions

| Decision | Choice | Why |
|---|---|---|
| Where does ranking happen? | **Server only.** No client-side index. | Data is login-gated, ranking logic must live in one place (an index in the browser would drift from the SQL). Revisit only for offline (PWA) later. |
| Making it feel instant | prefix matching on the last token, 120 ms debounce, request cancellation (✅ Phase 0), keep previous results on screen while the next load (`keepPreviousData` — reverses D7's "spinner for now"; confirm with product), topic list filtered locally with zero latency | cheapest wins before any infrastructure |
| Highlight transport | **private-use delimiter characters** (`U+E000` start, `U+E001` end) from Postgres, split into React nodes in the browser | no HTML from the API → no XSS surface; works for Cyrillic and accents |
| Facet semantics | disjunctive faceting: OR within a facet, AND across facets; each facet's counts ignore its *own* filter | standard behaviour users expect |
| URL state | `q`, `topic`, `cat`, `type`, `sort` in the query string | back button, shareable searches (Plan 1) |
| One search for everything | merge KB and Q&A search; `type` facet separates Questions from Cards | users don't know which tab holds the answer |

## 3. Backend work (KnowledgeBase repo — see BACKEND-REQUESTS.md)

### BR-1 — Query builder: OR the synonyms, AND the user's words, prefix the last word  *(P0, ~1 d)*

Replace `websearch_to_tsquery(kb_expand_query(...))` with a `kb_build_tsquery(p_query, p_locale, p_prefix)`
function: per user token build `token | alias₁ | alias₂ …`, then AND across tokens. If the query contains
websearch operators (`"…"`, `-`, `or`), fall back to plain `websearch_to_tsquery` unchanged.

```sql
-- sketch (sanitize tokens; handle empty results; mind plainto_tsquery NOTICEs on stop-words)
create or replace function kb_build_tsquery(p_query text, p_locale text, p_prefix boolean default false)
returns tsquery language plpgsql stable as $$
declare
  cfg regconfig := kb_regconfig(p_locale);
  toks text[] := regexp_split_to_array(lower(btrim(coalesce(p_query,''))), '\s+');
  tok text; f text; term tsquery; q tsquery; i int := 0;
begin
  if p_query ~ '["]|(^|\s)-|\sor\s' then return websearch_to_tsquery(cfg, p_query); end if;
  foreach tok in array toks loop
    continue when tok = '';
    i := i + 1;
    term := case when p_prefix and i = array_length(toks,1)
                 then to_tsquery(cfg, regexp_replace(tok, '[^[:alnum:]_]', '', 'g') || ':*')
                 else plainto_tsquery(cfg, tok) end;
    for f in select a.expansion from search_aliases a
             where lower(a.alias) = tok and (a.locale is null or a.locale = p_locale)
    loop term := term || plainto_tsquery(cfg, f); end loop;
    q := case when q is null then term else q && term end;
  end loop;
  return coalesce(q, ''::tsquery);
end $$;
```

Acceptance: `cedula` returns every card containing `cedula` **or** `cédula` **or** `DNIC`; `new cedula` still
requires both concepts; `ced` (prefix mode) finds cédula cards; the eval set (BR-9) shows no per-locale
Recall@3 regression.

### BR-2 — Accent-insensitive matching (POLISH item I)  *(P0, ~1.5 d)*

Prefer **text-search configurations with the `unaccent` dictionary** over wrapping every field in a function:
the same configuration is used by the index trigger, the query builder and `ts_headline`, so index, query and
highlighting agree automatically.

```sql
create extension if not exists unaccent;           -- Supabase: schema `extensions`
create text search configuration kb_ru (copy = russian);
alter text search configuration kb_ru
  alter mapping for hword, hword_part, word with unaccent, russian_stem;
-- repeat: kb_en (english), kb_es (spanish), kb_de (german), kb_pt (portuguese)
-- then point kb_regconfig(locale) at these and redeploy data so every search_vector is rebuilt
```

Also use an `IMMUTABLE` unaccent wrapper in the trigram comparisons (`similarity(kb_unaccent(lower(title)), …)`)
and rebuild the trigram indexes on the same expression. **Verify with the eval set:** the stock `unaccent`
rules fold some Cyrillic letters (e.g. `й`→`и`, `ё`→`е`); `ё/е` folding is welcome, `й/и` may add false
positives — measure before accepting, and customize the rules file if needed.

### BR-3 — Snippets  *(P1, ~1 d)*

`search_cards` returns `title_hl` and `snippet`. `ts_headline` is expensive on long bodies (max body ≈ 8.7 k
chars), so compute it **only for the page of results** (outer query over the already-limited rows):

```sql
ts_headline(cfg, body, tsq,
  'StartSel='||chr(57344)||', StopSel='||chr(57345)||
  ', MaxFragments=2, MaxWords=28, MinWords=12, ShortWord=2, FragmentDelimiter=" … "') as snippet
-- title: same options with HighlightAll=true
```

Return `matched_via: 'keyword' | 'fuzzy'` (fuzzy = passed only via trigram similarity; no marks expected).

### BR-4 — Filters, sort, facets  *(P1, ~1.5 d)*

- `search_cards` gains `p_topic_ids text[]`, `p_categories text[]`, `p_types text[]` (`faq`/`kb`) and
  `p_sort text` (`relevance` default | `updated`). Refactor the shared `base` CTE into a helper so
  `search_facets` can reuse it.
- New `search_facets(p_query, p_locale, p_topic_ids, p_categories, p_types, p_include_internal)` →
  `(facet, value, n)` rows with disjunctive counting.
- Edge Function: `GET /search?q&topic=a,b&cat=x,y&type=faq&sort=updated&limit&offset&prefix=1&facets=1&snippets=1`.
  Response adds `facets: { topic:[{value,n}], category:[…], type:[…] }`. Topic labels come from topic
  translations; **category labels are UI strings** (web i18n), not DB text.
- Validate params against allow-lists in the function (unknown values ignored).

### BR-5 — Latency  *(P1, ~1 d, measure first)*

1. Add a `Server-Timing` header (`auth`, `profile`, `rpc`) and record a baseline for cold and warm calls.
2. Skip the `profiles` lookup when `locale` is supplied.
3. Verify the JWT locally (`jose` with the project's JWKS / secret, cached) instead of `auth.getUser` per
   request; fall back to `getUser` if verification isn't possible. Trade-off: a revoked session stays valid
   until its JWT expires (default 1 h) — acceptable for read-only knowledge content; note it in the README.
4. Targets: server **p50 ≤ 120 ms, p95 ≤ 300 ms (warm)**.

### BR-9 — Relevance eval harness (shared with Plan 3)  *(P0 start in week 1)*

`scripts/eval-search.mjs` in the backend repo: for each `(locale, query, expected_card_id)` compute Recall@1/3/10
and MRR per locale and per query class. Gold set sources: the 90 question phrasings (note: these are
title-derived and therefore lexically easy), **independently written paraphrases**, accent-less / typo /
transliteration variants (`cedula`, `седула`), mixed-language queries, and a reviewed sample of real chat
questions (strip author names and any personal data; keep the set **out of any public repo**). Every search change
in BR-1..BR-5 must keep Recall@3 within 1 pt per locale and improve the accent-less class.

## 4. Web implementation

### Data layer
Build on the Phase 0 conventions (`docs/DEVELOPMENT.md`) rather than a parallel stack:
- Extend `searchCards` in `src/lib/api.ts` (already takes an `AbortSignal`) — or add `src/features/search/api.ts`
  with the same pattern — with the typed `SearchResponse` (adds `snippet`, `title_hl`, `facets`, `matched_via`)
  and the new params (`topic[]`, `cat[]`, `type`, `sort`, `prefix`, `facets`, `snippets`).
- Extend `SearchParams` / `kbKeys.search` in `src/data/keys.ts` (the key already carries `locale` and
  `includeInternal`) and `searchQuery` / `useSearch` in `src/data/queries.ts`; add `placeholderData:
  keepPreviousData` (see D7) and a `staleTime` of 60 s for search (default is 5 min). Cancellation and
  stale-response protection come with it. Update the mock's `/search` (`src/mocks/api.ts`) with the same params.
- Debounce: `SearchBar` debounces internally (250 ms) and must keep its echo protection; either lower its delay
  to 120 ms or move to `useDebouncedValue(value, 120)`; minimum 1 character in prefix mode, 2 otherwise.
- `src/lib/search-url.ts`: `parseSearchParams(URLSearchParams)` / `toSearchParams(state)` with allow-listed
  values; unit-tested round trip, junk ignored, order-stable output. Generalises today's `useSearchQuery`
  (`src/routes/useSearchQuery.ts`: push on the first search, replace on refinements).

### Highlighting
- `src/lib/highlight.ts`
  - `splitHighlight(text)` → `Array<{ text: string; hit: boolean }>` by `U+E000`/`U+E001`; tolerant of
    unbalanced markers; strips any stray markers from text before display.
  - `highlightTokens(text, query)` fallback for fuzzy matches and for titles when the API sends none:
    accent-insensitive (`normalize('NFD')` **per character** so indexes stay aligned) and `ё`/`е` aware;
    tokens shorter than 2 chars ignored; escape regex metacharacters.
- `<Highlight text query? />` renders `<mark>` nodes; **no `dangerouslySetInnerHTML`** — already an ESLint
  error since Phase 0 (`no-restricted-syntax` rule in `eslint.config.js`, same effect as `react/no-danger`). Style: `bg-amber-200/70 text-slate-900 rounded-sm px-0.5`; verify
  contrast ≥ 4.5:1.

### Command palette (`src/features/search/Palette.tsx`, lazy chunk — `React.lazy` like the login form in `src/app/guards.tsx`; must stay out of the `npm run size` first load, D9)
- Opens with `Ctrl/Cmd+K` and `/` (ignored while typing in inputs); header search field on desktop; full-screen
  sheet on phones. Built on `<dialog>` for focus trapping.
- Sections: **Topics** (filtered locally from the already-loaded topic list — instant), **Questions** (top 3,
  `type=faq`), **Cards** (top 5, `type=kb`); footer row "See all results for “x”" (`Enter` with nothing
  selected goes to `/search?q=`). Empty query: recent searches + most-asked questions + "Browse topics".
- ARIA: WAI-ARIA APG **combobox** pattern — `role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`; results `role="listbox"` / `role="option"`; polite live region announcing the
  result count; `Esc` closes and restores focus.
- Recent searches: `localStorage` (`kb.recent`, last 8, de-duplicated, device-local, clear button, wrapped in
  `try/catch` — storage may be unavailable).

### Results page (`/:lang/search`)
- New lazy route in `src/app/routes.tsx` + `searchPath()` in `src/lib/paths.ts`. Redirect today's search URLs
  (`/:lang?q=…`, `/:lang/faq?q=…`) to it so links shared since Phase 0 keep working.
- Layout: sticky query bar; filter chips (removable) + "Clear all"; result count (`aria-live`); sort select
  (Relevance | Recently updated); facet panel (left on ≥ lg, bottom-sheet `<dialog>` on mobile) as
  `<fieldset><legend>` checkbox groups with counts: **Type** (Questions / Cards), **Topic** (top 8 + "Show
  all"), **Category**. Topic filter inside a topic page is just a preset of this.
- `SearchResultItem`: highlighted title, topic chip (click = add topic filter), category chip, freshness cue
  (`staleness_risk` + "Updated <date>"), 2–3 line highlighted snippet, review/low-evidence badges, FAQ icon,
  copy-link action (Plan 1). Whole card is one link target to the card page.
- Pagination: `useInfiniteQuery` + **"Show more"** button (20 per page, `offset`); count from the API `total`.
- Merge the separate KB / Q&A search modes; the Q&A tab keeps browsing ("Most asked", per topic).

### Zero results and recovery
1. Show active filters as removable chips with "remove filters to see N more" (counts from facets).
2. Offer "Try fewer words" (drops the last word) and the three most-asked questions.
3. *(P2)* did-you-mean: backend `search_terms(locale, term)` vocabulary built at deploy + `word_similarity`
   lookup returning a corrected string. Largely subsumed once Plan 3 ships, so schedule last.

### i18n
Keys in all 5 dictionaries: `searchTitle`, `searchPlaceholderPalette`, `quickJump`, `questions`,
`knowledgeCards`, `topicsLabel`, `seeAllResults`, `recentSearches`, `clearRecent`, `filters`, `clearFilters`,
`sortRelevance`, `sortUpdated`, `showMore`, `typeFilter`, `categoryFilter`, `topicFilter`, `removeFilter`,
`noResultsFiltered`, `tryFewerWords`, `updatedOn`, and one `cat.<content_category>` key per category
(`reference`, `overview`, `advice`, `warning`, `checklist`, `community_experience`, `instruction`,
`resource_list`).

## 5. Testing

- **Unit:** `splitHighlight` (none / adjacent / unbalanced / stray markers), `highlightTokens` (accents,
  `ё/е`, Cyrillic, regex metacharacters, overlapping tokens), URL (de)serialization, debounce hook, recent-searches
  store (storage throwing).
- **Component (RTL + MSW):** palette keyboard flow (open, type, ↑↓, Enter, Esc, focus return); **stale response
  ignored** (first request delayed, second returns first → UI shows the second; the hook-level version exists
  since Phase 0 in `src/data/queries.test.tsx`); filters update URL and results;
  zero-result states; facet counts; `Show more`.
- **E2E (Playwright):** `Ctrl+K` → type → open a card → back returns to the palette-less page; filtered search
  URL reloads to the same state; mobile sheet; keyboard-only run; axe on palette and results.
- **Relevance (backend, BR-9):** per-locale Recall@k gates for BR-1/2; accent-less class at parity with accented.
- **Performance:** Playwright trace with a 50 ms mock API: keystroke → painted results ≤ 100 ms client-side; in
  staging with the real API: **p95 ≤ 350 ms** warm on a throttled 4G profile. Palette chunk ≤ 12 kB gzip.

## 6. Acceptance criteria

1. `ced` (prefix) shows cédula cards; `cedula` and `cédula` return the same top 3.
2. Every keyword-matched result shows highlighted title/snippet terms; fuzzy matches fall back to token
   highlighting; no raw HTML from the API is ever injected.
3. Filters (type/topic/category) combine as specified; facet counts match result counts; the URL reproduces
   the exact view after reload and back/forward.
4. Palette is fully keyboard- and screen-reader operable; axe reports no violations.
5. p95 keystroke→results ≤ 350 ms warm (staging), server p95 ≤ 300 ms.
6. Eval harness: no per-locale Recall@3 regression > 1 pt vs the pre-change baseline.
7. Lint rule `react/no-danger` is on and passes.

## 7. Risks

| Risk | Mitigation |
|---|---|
| OR-expansion over-matches broad aliases (`UTE`, `cédula`) | keep per-token grouping; curated aliases only (`INCLUDE_AUTO_GLOSSARY=false`); eval set |
| `unaccent` folding hurts Russian precision | measure with the eval set; custom rules file if needed |
| `ts_headline` slows large pages | compute after `limit`; cap `MaxWords`; skip when `snippets=0` |
| Local JWT verification keeps revoked sessions alive ≤ 1 h | documented, read-only content; keep `getUser` fallback |
| Facet counts double the query cost | single `facets=1` call only on the results page, not in the palette |
| Cold starts dominate p95 | measure (BR-5.1); consider a scheduled warm-up only if data shows it matters |

## 8. Estimate

Web 6–8 d (palette 2.5, results + facets 2.5, highlight utils/tests 1, zero-state + recents 1, a11y/polish
1). Backend 5–6 d (BR-1 1, BR-2 1.5, BR-3 1, BR-4 1.5, BR-5 1; BR-9 harness counted in Plan 3).
