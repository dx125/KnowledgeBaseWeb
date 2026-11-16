import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../lib/api';

/** How long fetched content counts as fresh. Content only changes on dataset deploys. */
export const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Retry once on network errors and 5xx; never on 4xx (401 = signed out, 404 = gone,
 * 400 = bad request — asking again won't help).
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 1;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}
