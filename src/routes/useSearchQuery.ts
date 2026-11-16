import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * The search text, kept in the URL as `?q=`. The first search adds a history entry, and
 * refining or clearing it replaces that entry. So Back leaves the search instead of
 * replaying every edit, and a reload or shared link shows the same results.
 */
export function useSearchQuery(): [string, (next: string) => void] {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const setQ = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next) updated.set('q', next);
          else updated.delete('q');
          return updated;
        },
        { replace: q !== '', preventScrollReset: true },
      );
    },
    [setParams, q],
  );
  return [q, setQ];
}
