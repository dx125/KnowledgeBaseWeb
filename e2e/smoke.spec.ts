// Smoke journeys through the real UI in a browser, against mock mode.
import { expect, test } from '@playwright/test';
import { ru, startSignedIn, topicTile } from './helpers';

test('browse: topic → cards → back to all topics', async ({ page }) => {
  await startSignedIn(page);
  await topicTile(page, 'Аренда жилья').click();

  await expect(page.getByRole('heading', { level: 2, name: 'Аренда жилья' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByRole('article').first().getByRole('heading')).toHaveText('Аренда: обзор');

  await page.getByText(ru('backToTopics')).click();
  await expect(page.getByRole('heading', { name: ru('topicsHeading') })).toBeVisible();
});

test('search the whole base', async ({ page }) => {
  await startSignedIn(page);
  await page.getByPlaceholder(ru('searchPlaceholder')).fill('депозит');
  await expect(page.getByText(new RegExp(`^\\d+ ${ru('results')}$`))).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Не платите депозит, не увидев квартиру' })).toBeVisible();
});

test('Q&A: most asked → expand an answer', async ({ page }) => {
  await startSignedIn(page);
  await page.getByText(ru('navFaq'), { exact: true }).click();
  await expect(page.getByRole('heading', { name: ru('mostAsked') })).toBeVisible();

  const question = page.getByRole('button', { name: /Сколько ждать cédula\?/ }).first();
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(ru('needsReviewNote')).first()).toBeVisible();
});

test('switch language', async ({ page }) => {
  await startSignedIn(page);
  await page.getByRole('combobox', { name: ru('language') }).selectOption('en');
  await expect(page.getByRole('heading', { level: 3, name: 'Renting a home' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
