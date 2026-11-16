import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { kbKeys } from '../data/keys';
import { authClient } from '../lib/auth';
import { createTestQueryClient, signInDirect } from '../test/session';
import { AuthProvider, useAuth } from './AuthProvider';

function Probe() {
  const { user, loading } = useAuth();
  return <p>{loading ? 'loading' : (user?.email ?? 'signed out')}</p>;
}

function renderWithAuth() {
  const client = createTestQueryClient();
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return client;
}

const someCachedData = (client: ReturnType<typeof createTestQueryClient>) =>
  client.setQueryData(kbKeys.topics({ locale: 'en', includeInternal: true }), [{ topic_id: 'topic.secret' }]);

describe('AuthProvider', () => {
  it('reads the stored session', async () => {
    await signInDirect('stored@example.test');
    renderWithAuth();
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('stored@example.test')).toBeInTheDocument();
  });

  it('clears all cached API data on sign-out', async () => {
    await signInDirect('a@example.test');
    const client = renderWithAuth();
    await screen.findByText('a@example.test');
    someCachedData(client);

    await act(() => authClient.signOut());
    await screen.findByText('signed out');
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it('clears cached data when another account signs in', async () => {
    await signInDirect('a@example.test');
    const client = renderWithAuth();
    await screen.findByText('a@example.test');
    someCachedData(client);

    await act(() => signInDirect('b@example.test'));
    await screen.findByText('b@example.test');
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it('keeps the cache when the same user refreshes the token', async () => {
    await signInDirect('a@example.test');
    const client = renderWithAuth();
    await screen.findByText('a@example.test');
    someCachedData(client);

    await act(async () => {
      const { error } = await authClient.refreshSession();
      if (error) throw error;
    });
    await waitFor(() => expect(screen.getByText('a@example.test')).toBeInTheDocument());
    expect(client.getQueryCache().getAll()).toHaveLength(1);
  });

  it('useAuth outside the provider is a programming error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs the thrown error
    expect(() => renderHook(() => useAuth())).toThrow(/inside <AuthProvider>/);
  });
});
