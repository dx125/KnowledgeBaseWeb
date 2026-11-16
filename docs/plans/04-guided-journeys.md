# Plan 4 — Guided step-by-step journeys

**Goal:** turn the knowledge base's topic-organized cards into **ordered paths** ("Residency and cédula",
"Set up as self-employed", "Bring your car and licence") that adapt to the user's situation, show what to do
next and what depends on what, and remember progress. The user answers a few questions once; steps that don't
apply disappear; each step links to the detailed cards.

This is the most distinctive and most expensive feature: engineering is moderate, **content is the bottleneck**.

## 1. Why it can't be derived from the data (verified)

- Cards are organized by **topic**, not by sequence. Most topics have `overview / checklist / advice / warning /
  community_experience` cards. Real step-level cards (`instruction`, `reference`) exist mostly for residency,
  banking, taxes/empresa, renting and buying; **documents/apostille, healthcare, moving, work and utilities have
  no instruction cards**, only overviews and checklists.
- The dataset's `prerequisite_card_ids` are a **star** (228 vendor edges, each pointing at the topic overview;
  19 editorial) — not an ordering of steps. There is no cross-topic prerequisite graph.
- Therefore a journey is an **editorial artifact**: it owns the *sequence, conditions and short step text*; the
  cards own the *details*. Keeping details in cards avoids duplicating (and diverging from) content.

## 2. Product design

### 2.1 Journey model
A journey is a list of **steps** grouped into **phases** ("Before you arrive", "First weeks", "First months").
Each step has:

- `title`, `summary` (2–3 sentences: what, where, why now), optional `bring[]` (documents), `watch_out`
  (one pitfall), rough duration range, optional `source` (official URL or "community experience") and
  `reviewed_at`;
- `card_ids[]` — the detail cards (inherit their `needs_review` / `staleness_risk` badges and `last_updated`);
- `faq_card_ids[]` — related Q&A answers;
- `requires[]` — step IDs that should be done first (DAG);
- `when` — an optional visibility rule over the user's **facts** (§2.2).

### 2.2 Facts (the questionnaire)
Short, skippable, one question per screen; each answer is a **fact** with a stable ID. Draft facts for v1
(final list decided with the content owner):

| fact | kind | options / notes |
|---|---|---|
| `stage` | single | planning · arrived-tourist · residency-in-process · resident |
| `citizenship_group` | single | options chosen with the reviewer; **rules depending on citizenship must cite a source** |
| `has_family` | multi | partner · children · pets |
| `work_mode` | single | remote-employee · freelance · own-company · local-job · not-working |
| `has_car` / `licence_from` | bool / single | drives licence-exchange and import steps |
| `housing` | single | rent · buy · already-housed |
| `plans_to_travel` | bool | gates "leaving while pending" steps |

**Three-valued logic:** a step with an unknown fact is **shown** with a "Depends on: <question>" chip instead of
hidden; only a definite `false` hides it. Users can always "mark as not applicable" manually and un-hide steps.

### 2.3 Rule language (no `eval`)
Plain JSON evaluated by a tiny, unit-tested interpreter:

```json
{ "when": { "all": [ { "fact": "has_car", "eq": true },
                     { "fact": "licence_from", "in": ["RU", "BY"] } ] } }
```
Operators: `eq`, `neq`, `in`, `not_in`, `includes` (multi), `all`, `any`, `not`. Unknown fact → `unknown`.

### 2.4 States and the "next step"
`todo · doing · done · not-applicable`. A step is **blocked** while any `requires` step isn't `done`/`n/a`.
"Next step" = first non-blocked `todo/doing` step in order. Progress = done / applicable.
"Why am I seeing this?" shows the fact(s) that made the step visible.

### 2.5 Draft v1 content (needs domain review — a starting map, not advice)
Mapped to real cards that exist today:

**Journey 1 — Residency and cédula (first months)** — the only topic with rich step cards.
`residency_cedula_immigration`: `overview`, `checklist`, `instruction.kak_podhodit_k_rezidencii_i_c_dula`,
`reference.ref_zapis_migraciones`, `reference.ref_permiso_reingreso`, `reference.ref_novaya_seduly`, `warning`,
`advice`, `community_experience`; plus `documents_apostille_translation` (overview, checklist),
`health_insurance_medicine` (overview, checklist), `bank_accounts_cards.instruction.kak_gotovitsya_k_otkrytiyu_bankovskogo_scheta`,
`utilities_internet_mobile.instruction.kak_podklyuchat_kommunalnye_uslugi_i_svyaz`, `work_remote_jobs.checklist`;
FAQ: `faq_residency.q08…q11`.

Candidate steps (order and dependencies to be confirmed by the reviewer):
1 Understand the process → 2 Prepare and legalize documents → 3 Book the Migración appointment → 4 File for
residency → 5 *(if travelling)* Permiso de reingreso → 6 Get the cédula (new format; Registro Civil order) → 7
Health coverage → 8 Bank account → 9 *(if working)* Proof of income / work setup → 10 Utilities and internet
*(if renting)*.

**Journey 2 — Self-employed / empresa**: `taxes_accounting_empresa` (`instruction.kak_vybrat_mezhdu_unipersonal_monotributo_i_sas`,
`instruction.kak_otkryt_unipersonal_empresa_unipersonal`, `instruction.chto_delat_posle_registracii_empresa_v_dgi_i_bps`,
`reference.ref_nalogovoe_rezidentstvo`, `reference.ref_nalogovye_kanikuly`, warnings) + `faq_taxes`.
**Journey 3 — Car and licence**: `transport_driving_car.reference.ref_obmen_prav_rossiya`, checklist, warning,
`faq_transport.q09_licence_exchange_docs`.
**Journey 4 — Rent** (`real_estate_rent` instructions/checklists) · **Journey 5 — Buy** (`real_estate_purchase`
instruction + `ref_rashody_pokupki_itp_escribano` + `ref_proishozhdenie_sredstv_bank`).

Launch scope: **Journey 1 only**, then 2–3 after feedback.

### 2.6 Explicit non-goals for v1
No deadline/reminder engine, no calendar export, no account sync, no per-citizenship legal logic without cited
sources, no automatic generation of journeys from chat data.

## 3. Privacy and safety

> **D4 confirmed (2026-11-15): answers and progress stay on the device.** Account sync (BR-12b) is dropped. With
> D1 (no login) journeys must also work signed-out, which local storage already satisfies; `GET /journeys*`
> endpoints are public-read like the card endpoints (public journeys only).

- Answers like citizenship and immigration stage are **sensitive personal data**. Decision D4 default: **stored
  only on the device** (`localStorage`), no analytics, no server copy. Provide "Export", "Import" and "Delete my
  data". Optional account sync (phase 2) is an explicit opt-in toggle, one row per user/journey, own-row access
  only through the API.
- Never send facts to the search/embedding providers (Plan 3) or put them in URLs sent to others. Sharing a
  journey link shares **no answers** (optionally a separate "share my answers" export).
- Each step shows its trust signals: card badges, the step's `reviewed_at`, and a standing notice "Community-
  derived guidance — confirm with the official source". Time- or law-sensitive claims need a `source` or are
  marked `community experience`.

## 4. Backend implementation (KnowledgeBase repo, BR-12)

### 4.1 Authoring format — `dataset-patches/journeys.json`
RU is the source language; EN/ES/DE added like cards; `pt` optional. Everything for a journey is **one JSON
document** (steps are small and strongly ordered; relational tables would only add joins):

```jsonc
{
  "journey_id": "journey.residency_first_months",
  "version": 1, "status": "active", "visibility": "public", "position": 1,
  "reviewed_at": "2026-..", "owner": "<editor>",
  "facts": [ { "fact_id": "stage", "kind": "single",
               "options": [ { "id": "planning", "text": { "ru": "…", "en": "…" } } ],
               "text": { "ru": "На каком вы этапе?", "en": "Where are you now?" } } ],
  "phases": [ { "phase_id": "p1", "text": { "ru": "…", "en": "…" } } ],
  "steps": [ {
    "step_id": "s03_book_migracion", "phase_id": "p1",
    "requires": ["s02_documents"],
    "when": { "fact": "stage", "neq": "resident" },
    "card_ids": ["card.residency_cedula_immigration.reference.ref_zapis_migraciones"],
    "faq_card_ids": ["card.faq_residency.q10_migracion_appointment"],
    "duration_days": [1, 30], "source": { "kind": "official|community", "url": "…" },
    "text": { "ru": { "title": "…", "summary": "…", "bring": ["…"], "watch_out": "…" }, "en": { … } }
  } ]
}
```

### 4.2 Storage and ingest
- `journeys(journey_id pk, status, visibility, position, version, reviewed_at, doc jsonb)` and
  `journey_card_refs(journey_id, card_id)` (referential integrity, plus "this card is used in journey X" on the
  card page). RLS + lock-down like every other table; `service_role` read only.
- `scripts/lib/apply-journeys.mjs` joins the patch-layer pipeline (like `apply-faq.mjs`); `deploy.mjs` inserts.
- **Validation at deploy (fails the deploy):** JSON schema; every `card_id`/`faq_card_id` exists **and is
  public+active** (for public journeys); `requires` refer to existing steps in the same journey; **no cycles**
  (topological sort); every `when` fact is declared; every text has `ru` and `en` (es/de required for launch,
  `pt` optional); ≤ 15 steps per journey, ≤ 8 facts.
- `scripts/preview-journey.mjs` prints a Mermaid graph and a text outline for reviewers.

### 4.3 API
- `GET /journeys?locale` → summaries (`journey_id`, title, summary, step count, est. duration, `reviewed_at`).
- `GET /journeys/:id?locale&internal` → the document with `locale` resolved (English fallback per field),
  card titles/badges/`last_updated` resolved for every referenced card, steps whose cards fall out of scope
  dropped with a flag.
- *(Phase 2)* `GET/PUT /journeys/:id/progress` backed by `journey_progress(user_id, journey_id, facts jsonb,
  steps jsonb, updated_at)` with own-row RLS; merge = last-write-wins **per step** using per-step timestamps.

## 5. Web implementation

Builds on the Phase 0 foundation (`docs/DEVELOPMENT.md`): routes are lazy modules registered in
`src/app/routes.tsx` with paths from `src/lib/paths.ts`; data hooks follow `src/data/` (query keys carry
`locale` and `internal`, fetchers forward the `AbortSignal`); the `/journeys` endpoints get mock handlers and
synthetic fixtures in `src/mocks/` so `dev:mock`, Vitest and Playwright work without the backend. The journeys
chunk must stay out of the first load (D9).

```
src/features/journeys/
  engine.ts        pure: evaluateRule, visibleSteps, blockedBy, stepStatus, nextStep, progress, explain
  store.ts         progress + facts persistence (localStorage, versioned schema, export/import/delete)
  api.ts · hooks.ts
  JourneyList.tsx · JourneyPage.tsx · PhaseSection.tsx · StepCard.tsx
  FactsWizard.tsx · ProgressBar.tsx · NextStepBanner.tsx · PrintView.tsx
```

- **Routes** (Plan 1 scheme): `/:lang/journeys`, `/:lang/journeys/:id`, `/:lang/journeys/:id/steps/:stepId`
  (deep link opens the step). Lazy-loaded chunk; feature flag `VITE_FEATURE_JOURNEYS` (a public flag, safe in the
  bundle).
- **Entry points:** home "Start here" banner; topic pages show "Part of: <journey>" chips; card pages show
  "Used in journey" (from `journey_card_refs`).
- **FactsWizard:** modal stepper, one question per screen, "Skip" and "I'm not sure" (→ unknown), back button,
  editable later from "My situation" summary on the journey page.
- **JourneyPage:** header (title, reviewed date, notice), `NextStepBanner`, progress, phases as `<section>`s with
  an ordered list `<ol>` of steps. `StepCard`: checkbox / state menu, title, summary, `bring` list, `watch_out`,
  duration, blocked-by chips ("after: Prepare documents"), "why am I seeing this" popover, expandable **card
  details** that render the linked cards (reuse the card-body component from Plan 1) and FAQ answers.
- **Print / PDF:** `@media print` stylesheet producing a clean checklist (visible steps, checkboxes, `bring`
  lists, source links); no JS needed.
- **Persistence:** key `kb.journey.v1.<journeyId>` → `{ facts, steps: { [id]: { state, at } }, updatedAt }`;
  wrapped in `try/catch`; schema version + migration function; "Export JSON" / "Import" / "Delete all my data".
  If a journey document version changes, keep state for steps that still exist and drop the rest.
- **Accessibility:** `<ol>`, `aria-current="step"` on the next step, state changes announced in a polite live
  region, full keyboard operation, focus management in the wizard dialog, no information by color alone.
- **i18n:** UI strings in all 5 dictionaries (`journeys`, `startHere`, `mySituation`, `nextStep`, `blockedBy`,
  `markDone`, `markNotApplicable`, `whyThisStep`, `shownBecause`, `unknownDependsOn`, `exportProgress`,
  `importProgress`, `deleteMyData`, `printChecklist`, `reviewedOn`, `communityGuidance`, state labels, wizard
  buttons); journey text itself comes from the API.

## 6. Content production workflow

1. Owner picks the journey and audience; drafts the step list from existing cards (§2.5) with sequence and
   conditions.
2. Write RU step summaries (short, concrete, no legal conclusions without a source); attach `card_ids`.
3. Verify time/law-sensitive claims against official pages (record `source`); anything unverifiable is labeled
   `community experience`.
4. Translate EN/ES/DE (and `pt` if in scope) using the same process as cards; run `preview-journey.mjs`; deploy to a
   staging project; review on a phone.
5. Domain reviewer signs off → set `reviewed_at`; schedule re-review (e.g. every 6 months, sooner for steps with
   `staleness_risk: high`).

Missing step-level content found while mapping (e.g. documents/apostille, healthcare enrolment, moving/import
procedure) becomes new cards in the backend repo's `new-cards.json` — those cards are useful on their own.

## 7. Testing

- **Engine (table-driven unit tests):** every operator; three-valued logic (unknown shows, false hides);
  `requires` blocking; n/a handling; next-step selection; progress math; `explain`; large/odd inputs.
- **Backend (deploy validation tests):** dangling card, non-public card in a public journey, cycle, undeclared
  fact, missing translation → deploy fails with a readable message.
- **Store:** versioning/migration, corrupted JSON, storage unavailable, export/import round trip, delete.
- **Component (RTL):** wizard flow incl. skip/unknown; step state changes update progress and next step; blocked
  chips; deep-link opens the step; print stylesheet snapshot.
- **E2E (Playwright, mock API):** complete the wizard → steps filter → mark done → reload → state persists →
  switch language → state persists → export/import → delete wipes it; axe on journey pages.
- **Content QA (manual, per journey):** reviewer checklist — each step's cards exist, order sensible, sources present,
  badges visible, phone layout.

## 8. Acceptance criteria

- A new user can answer the questionnaire (or skip it), sees only applicable steps, and sees "Next step".
- Progress survives reload and language switch and never leaves the device unless the user opts in.
- Invalid journey data cannot be deployed (validation tests).
- Every step shows the trust signals of its cards plus its own `reviewed_at` and source/community label.
- Printable checklist works; keyboard-only and screen-reader pass; axe clean.
- Journey 1 reviewed and signed off by a domain reviewer; all 4 content locales present.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Wrong or stale legal/administrative guidance | steps carry source + reviewed-at + card badges; standing notice; start with one journey; scheduled re-review |
| Content effort underestimated | scope v1 to Journey 1; add journeys only after feedback; reuse existing cards for detail |
| Sensitive answers leak | local-only by default, no analytics, no facts in URLs/search/embeddings; delete + export controls |
| Rule language grows into a programming language | closed operator set, schema-validated, no eval; complexity review before adding operators |
| Step order is contested (it varies by case) | `requires` only where truly necessary; otherwise order is a recommendation, not a lock |
| Journey/card drift (card renamed or removed) | deploy validation + `journey_card_refs` + alias table (Plan 1 BR-7) |

## 10. Estimate

Web 9–11 d (engine + store 3, journey page/steps 3.5, wizard 1.5, print/a11y/i18n/tests 2). Backend 4–5 d
(schema + apply + validation 2.5, endpoints 1, preview tool 0.5, tests 1). **Content: 8–10 working days for
Journey 1 including verification and translation (mostly wall-clock for review); 4–6 d each afterwards.**
