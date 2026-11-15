# Web-side polish items

Split out of the backend repo's `docs/POLISH.md` when the web app moved to this repo. The
backend halves (schema, `deploy.mjs`, SQL functions) stay in the backend plan; item letters
match it. Status: **both items are implemented** in the current code (see `CardItem.tsx`,
`lib/api.ts`, `i18n.ts`).

After web changes run `npm run build`.

---

## B (P1) — Treat `public_overview` as a landing card (web half) — ✅ done

**2. `src/components/CardItem.tsx`** — treat overview as a landing card for styling:
```ts
const isSummary = card.card_type === 'summary';
// →
const isLanding = card.card_type === 'summary' || card.card_type === 'public_overview';
```
Use `isLanding` wherever `isSummary` drove the indigo "landing" styling. Optionally add an
"Overview" pill for `public_overview` (new i18n key `overviewBadge`, see §A6 for the i18n pattern).

---

## A (P2) — Related glossary / resources / entities panel (web half) — ✅ done

Backend half (A1–A3: tables, ingest, `get_card`) is in the backend repo's POLISH plan.
Resources are public-only (22 public resources since dataset v6.3); entities and curated
glossary terms are shown; internal resources are never ingested.

### A4. Web — fetch + render
`src/lib/api.ts`: add a `getCard` call and types.
```ts
export interface GlossaryRef { term: string | null; definition: string | null }
export interface ResourceRef { name: string | null; url: string | null; type: string | null }
export interface CardDetail {
  card_id: string; title: string | null; body: string | null;
  keywords: string[]; subtopics: string[];
  glossary: GlossaryRef[]; resources: ResourceRef[];
  /* …other get_card fields as needed… */
}
export async function getCard(cardId: string, locale: string): Promise<CardDetail> {
  const data = await apiGet<{ card: CardDetail }>(`/cards/${encodeURIComponent(cardId)}`, { locale });
  return data.card;
}
```
`src/components/CardItem.tsx`: add a "Details" toggle that lazy-loads `getCard(card.card_id, locale)`
and renders a panel under the body:
- **Glossary** — list of `term — definition` (skip null terms).
- **Resources** — list of `name` linking to `url` (open in new tab; show `type`).
Gate rendering on non-empty arrays so cards without links show nothing extra.

### A6. i18n — `src/i18n.ts`
Add keys to the `StringKey` union and all four dicts (`en/ru/es/de`), following the existing
pattern (EN is the fallback). Suggested keys/values:
| key | en | ru | es | de |
|---|---|---|---|---|
| `relatedTerms` | Related terms | Связанные термины | Términos relacionados | Verwandte Begriffe |
| `relatedResources` | Resources | Ресурсы | Recursos | Ressourcen |
| `details` | Details | Подробности | Detalles | Details |
| `overviewBadge` | Overview | Обзор | Resumen | Übersicht |
