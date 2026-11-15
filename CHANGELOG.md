# Web changelog

The web app used to live in the KnowledgeBase (backend) repo under `web/`. This file collects
its history. Entries before 2026-11-15 were reconstructed from the backend repo's git log and
changelogs; dataset/backend details stay in the backend repo's changelogs.

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
