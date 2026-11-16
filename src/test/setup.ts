import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, vi } from 'vitest';
import { server } from './server';

// findBy*/waitFor give up after 3 s instead of 1 s: whole-app tests type with a 250 ms
// debounce and can be slow on a loaded machine (CI, coverage). Passing tests don't wait longer.
configure({ asyncUtilTimeout: 3000 });

// index.html's <title>; jsdom starts without one (axe checks it).
document.title = 'Uruguay Knowledge Base';

// jsdom has no layout or scrolling; the router's ScrollRestoration calls this.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

// Listen at import time, not in beforeAll: the auth client may capture `fetch` when it is
// created, which happens while the test file's imports are evaluated.
server.listen({ onUnhandledRequest: 'error' });

afterEach(async () => {
  cleanup();
  server.resetHandlers();
  // Drop the persisted Supabase session and the mock's stored profiles.
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterAll(() => server.close());
