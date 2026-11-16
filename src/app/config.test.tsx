// Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY the app explains what to do.
// The real modules are loaded with empty values (no mocks): the auth client must not
// crash at import time, which used to leave a blank page.
import { render, screen } from '@testing-library/react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { t } from '../i18n';
import { recordApiRequests } from '../test/requests';

describe('missing configuration', () => {
  it('shows setup instructions and calls no API', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    onTestFinished(() => {
      vi.unstubAllEnvs();
    });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.resetModules();
    const { default: App, createAppRouter } = await import('../App');

    const requests = recordApiRequests();
    window.history.replaceState(null, '', '/en/topics/renting');
    const router = createAppRouter();
    onTestFinished(() => router.dispose());
    render(<App router={router} />);

    expect(await screen.findByRole('heading', { name: t('en', 'configError') })).toBeInTheDocument();
    expect(screen.getByText(t('en', 'configErrorHint'))).toBeInTheDocument();
    expect(logged).toHaveBeenCalledWith(expect.stringContaining('Missing VITE_SUPABASE_URL'));
    expect(requests).toEqual([]);
  });
});
