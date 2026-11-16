// URLs, browser history and reloads in a real browser (mock mode).
import { expect, test } from '@playwright/test';
import { ru, signIn, startSignedIn, topicTile } from './helpers';

test('back and forward buttons move between screens', async ({ page }) => {
  await startSignedIn(page);
  await expect(page).toHaveURL(/\/ru$/);

  await topicTile(page, 'Аренда жилья').click();
  await expect(page).toHaveURL(/\/ru\/topics\/renting$/);
  await page.getByRole('link', { name: ru('navFaq') }).click();
  await expect(page).toHaveURL(/\/ru\/faq$/);

  await page.goBack();
  await expect(page.getByRole('heading', { level: 2, name: 'Аренда жилья' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: ru('topicsHeading') })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 2, name: 'Аренда жилья' })).toBeVisible();
});

test('deep link → login → the linked topic; reload keeps it', async ({ page }) => {
  await page.goto('/ru/faq/topics/faq_daily_life');
  await signIn(page);
  await expect(page.getByRole('heading', { level: 2, name: 'Вопросы: быт' })).toBeVisible();
  await expect(page).toHaveURL(/\/ru\/faq\/topics\/faq_daily_life$/);

  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: 'Вопросы: быт' })).toBeVisible();
  await expect(page.getByText('Как получить местный номер?')).toBeVisible();
});

test('search lives in the URL: reload shows the same results, back leaves the search', async ({ page }) => {
  await startSignedIn(page);
  await page.getByPlaceholder(ru('searchPlaceholder')).fill('депозит');
  await expect(page).toHaveURL(/\?q=/);
  await expect(page.getByText(new RegExp(`^\\d+ ${ru('results')}$`))).toBeVisible();

  await page.reload();
  await expect(page.getByPlaceholder(ru('searchPlaceholder'))).toHaveValue('депозит');
  await expect(page.getByRole('heading', { name: 'Не платите депозит, не увидев квартиру' })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('heading', { name: ru('topicsHeading') })).toBeVisible();
});

test('language switch keeps the page; the account language sticks across links', async ({ page }) => {
  await startSignedIn(page, '/ru/topics/renting');
  const saved = page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().endsWith('/kb/me'));
  await page.getByRole('combobox', { name: ru('language') }).selectOption('en');
  await expect(page).toHaveURL(/\/en\/topics\/renting$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Renting a home' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await saved; // the account default is stored before we leave the page
  await page.goto('/es/topics/banking'); // signed in: the account language (en) wins
  await expect(page).toHaveURL(/\/en\/topics\/banking$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Banking & money' })).toBeVisible();
});

test('unknown pages show not found with a way home', async ({ page }) => {
  await startSignedIn(page, '/ru/topics/nope');
  await expect(page.getByRole('heading', { name: ru('notFoundTitle') })).toBeVisible();
  await page.getByRole('link', { name: ru('backToTopics') }).click();
  await expect(page.getByRole('heading', { name: ru('topicsHeading') })).toBeVisible();
});

test('new pages start at the top; back restores the scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 500 });
  await startSignedIn(page);
  const tile = topicTile(page, 'Транспорт и вождение'); // last tile, far down on a phone
  await tile.scrollIntoViewIfNeeded();
  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(300);

  await tile.click();
  await expect(page.getByRole('heading', { level: 2, name: 'Транспорт и вождение' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);

  await page.goBack();
  await expect(tile).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrolled - 50);
});
