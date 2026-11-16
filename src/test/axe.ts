// Accessibility checks with axe-core in jsdom.
//
// Rules: WCAG 2.0 / 2.1 / 2.2 A + AA and axe best practices, as in the Playwright scans
// (e2e/a11y.spec.ts). `color-contrast` is off here: jsdom has no layout or computed colours,
// so contrast is checked in the real browser only.
import axe, { type RuleObject } from 'axe-core';
import { expect } from 'vitest';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa', 'best-practice'];

/** Page-level rules that make no sense for a component rendered on its own. */
const PAGE_ONLY_RULES = ['region', 'landmark-one-main', 'page-has-heading-one', 'heading-order'];

function rules(component: boolean): RuleObject {
  const off: RuleObject = { 'color-contrast': { enabled: false } };
  if (component) for (const id of PAGE_ONLY_RULES) off[id] = { enabled: false };
  return off;
}

/** Violations as readable one-liners: `rule (impact): help → selectors`. */
export async function axeViolations(
  context: Element = document.body,
  { component = false }: { component?: boolean } = {},
): Promise<string[]> {
  const results = await axe.run(context, { runOnly: { type: 'tag', values: TAGS }, rules: rules(component) });
  return results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
}

/**
 * Fails with the list of violations. Whole pages by default; `component: true` skips
 * page-level rules (landmarks, heading order) for a component rendered in isolation.
 */
export async function expectNoAxeViolations(context?: Element, options?: { component?: boolean }) {
  expect(await axeViolations(context, options)).toEqual([]);
}
