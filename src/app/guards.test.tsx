// Edge paths of the app shell: missing configuration, and a crash while rendering a route.
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { t } from '../i18n';
import { api } from '../test/api-url';
import { renderApp, signIn } from '../test/app';
import { server } from '../test/server';

describe('a route that crashes while rendering', () => {
  it('shows the error with a way back home instead of a blank page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React and the router log the error
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // A malformed topic (an object where text is expected) makes React throw while rendering.
    server.use(
      http.get(api('/topics'), () =>
        HttpResponse.json({ topics: [{ topic_id: 'topic.renting', title: { bad: true }, card_count: 1 }] }),
      ),
    );
    const { user } = renderApp('/ru');
    await signIn(user);

    expect(await screen.findByText(`${t('ru', 'errorTitle')}:`)).toBeInTheDocument();
    expect(screen.getByText(/Objects are not valid as a React child/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t('ru', 'backToTopics') })).toHaveAttribute('href', '/ru');
  });
});
