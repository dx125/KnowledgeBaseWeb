import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { t, type Locale } from '../src/i18n';

export const ru = (key: Parameters<typeof t>[1]) => t('ru', key);

let seq = 0;
export const newEmail = () => `e2e-${Date.now()}-${++seq}@example.test`;

/** Sign in through the login form (any email + a 6+ char password works in mock mode). */
export async function signIn(page: Page, { email = newEmail(), locale = 'ru' as Locale } = {}) {
  await page.getByLabel(t(locale, 'email')).fill(email);
  await page.getByLabel(t(locale, 'password')).fill('secret1');
  await page.getByRole('button', { name: t(locale, 'signIn'), exact: true }).click();
  return email;
}

/** Open `path`, sign in and wait until the page behind the login has loaded. */
export async function startSignedIn(page: Page, path = '/') {
  await page.goto(path);
  await signIn(page);
  await expect(page.getByRole('button', { name: ru('signOut') })).toBeVisible();
  await expect(page.getByText(ru('sessionLoading'))).toHaveCount(0);
}

/** Click a topic tile by its title. */
export const topicTile = (page: Page, title: string) => page.getByRole('heading', { level: 3, name: title });

/**
 * axe-core on the current page in a real browser — WCAG 2.0/2.1/2.2 A + AA and best practices,
 * including colour contrast (which jsdom cannot check). Fails with one line per violation.
 */
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa', 'best-practice'])
    .analyze();
  const violations = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(violations).toEqual([]);
}
