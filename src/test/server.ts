// MSW in Node for Vitest: the same handlers as mock mode (Supabase Auth + KB API).
// Tests override single routes with `server.use(...)`; overrides reset after each test.
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

export const server = setupServer(...handlers);
