// A screen's chunk can fail to download (offline, or a deploy replaced the files).
// The app must show the error fallback with a way home, not a blank page.
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import { renderApp } from '../test/app';

vi.mock('../routes/HomeRoute', () => {
  throw new TypeError('Failed to fetch dynamically imported module');
});

describe('a lazy screen that fails to load', () => {
  it('shows the error fallback with a link that reloads the app', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderApp('/ru');
    // The route's code is requested at startup, so the fallback replaces the whole page.
    expect(await screen.findByText(`${t('ru', 'errorTitle')}:`)).toBeInTheDocument();
    const home = screen.getByRole('link', { name: t('ru', 'backToTopics') });
    expect(home).toHaveAttribute('href', '/ru');
    expect(home.tagName).toBe('A'); // a plain link: a full reload fetches the new files
    expect(screen.queryByRole('heading', { name: t('ru', 'signIn') })).not.toBeInTheDocument();
  });
});
