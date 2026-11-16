// Accessibility in a real browser (desktop + phone): axe on every screen and state,
// including colour contrast. Structure-level checks also run in jsdom (src/app/a11y.test.tsx).
import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, ru, startSignedIn, topicTile } from './helpers';

test('login and sign-up forms', async ({ page }) => {
  await page.goto('/ru');
  await expect(page.getByRole('heading', { name: ru('signIn') })).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByRole('button', { name: ru('switchToSignUp') }).click();
  await expect(page.getByRole('heading', { name: ru('signUp') })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('home, search results and the empty state', async ({ page }) => {
  await startSignedIn(page, '/ru');
  await expect(topicTile(page, 'Аренда жилья')).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByPlaceholder(ru('searchPlaceholder')).fill('депозит');
  await expect(page.getByText(new RegExp(`^\\d+ ${ru('results')}$`))).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByPlaceholder(ru('searchPlaceholder')).fill('zzzzqqq');
  await expect(page.getByText(ru('noResults'))).toBeVisible();
  await expectNoA11yViolations(page);
});

test('topic with expanded body and related context', async ({ page }) => {
  await startSignedIn(page, '/ru/topics/renting');
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(5);
  await cards.first().getByRole('button', { name: ru('readMore') }).click();
  await cards.nth(1).getByRole('button', { name: new RegExp(ru('relatedInfo')) }).click();
  await expect(page.getByText('Гарантия (garantía)')).toBeVisible();
  await cards.nth(3).getByRole('button', { name: new RegExp(ru('relatedInfo')) }).click();
  await expect(cards.nth(3).getByText(ru('noRelated'))).toBeVisible();
  await expectNoA11yViolations(page);
});

test('internal / unreviewed cards and their badges', async ({ page }) => {
  await startSignedIn(page, '/ru');
  await page.getByRole('checkbox', { name: ru('showInternal') }).check();
  await topicTile(page, 'Переезд с животными').click();
  await expect(page.getByText(ru('internalBadge')).first()).toBeVisible();
  await expectNoA11yViolations(page);

  await page.goto('/ru/topics/residency'); // reload: toggle resets (in memory), public badges only
  await expect(page.getByRole('article').first()).toBeVisible();
  await expectNoA11yViolations(page);
});

test('Q&A home, an expanded answer, a Q&A topic', async ({ page }) => {
  await startSignedIn(page, '/ru/faq');
  await expect(page.getByRole('heading', { name: ru('mostAsked') })).toBeVisible();
  await page.getByRole('button', { name: /Сколько ждать cédula\?/ }).first().click();
  await expectNoA11yViolations(page);

  await topicTile(page, 'Вопросы: быт').click();
  await expect(page.getByText('Как получить местный номер?')).toBeVisible();
  await expectNoA11yViolations(page);
});

test('not found page', async ({ page }) => {
  await startSignedIn(page, '/ru/topics/nope');
  await expect(page.getByRole('heading', { name: ru('notFoundTitle') })).toBeVisible();
  await expectNoA11yViolations(page);
});
