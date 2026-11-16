// Direct (non-UI) helpers for tests of hooks and components below the app shell.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { authClient } from '../lib/auth';
import { createQueryClient } from '../data/queryClient';

let seq = 0;

/** Sign in through the auth client against the mock (no UI). */
export async function signInDirect(email = `direct${++seq}@example.test`) {
  const { data, error } = await authClient.signInWithPassword({ email, password: 'secret1' });
  if (error) throw error;
  return data.session!;
}

/** The app's QueryClient config, without retries so failures surface immediately. */
export function createTestQueryClient(): QueryClient {
  const client = createQueryClient();
  client.setDefaultOptions({
    ...client.getDefaultOptions(),
    queries: { ...client.getDefaultOptions().queries, retry: false },
  });
  return client;
}

export function withQueryClient(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}
