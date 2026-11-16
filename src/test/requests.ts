// Record the KB API requests MSW sees during a test.
import { onTestFinished } from 'vitest';
import { server } from './server';
import { api } from './api-url';

export interface SeenRequest {
  method: string;
  path: string;
  params: Record<string, string>;
}

/** Start recording; the returned array fills as requests arrive. Stops when the test ends. */
export function recordApiRequests(): SeenRequest[] {
  const seen: SeenRequest[] = [];
  const listener = ({ request }: { request: Request }) => {
    if (!request.url.startsWith(api(''))) return;
    const url = new URL(request.url);
    seen.push({
      method: request.method,
      path: url.pathname.slice(new URL(api('')).pathname.length),
      params: Object.fromEntries(url.searchParams),
    });
  };
  server.events.on('request:start', listener);
  onTestFinished(() => {
    server.events.removeListener('request:start', listener);
  });
  return seen;
}
