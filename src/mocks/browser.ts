// MSW browser worker for mock mode (see .env.mock and README "Running without a backend").
// Uses public/mockServiceWorker.js; where Service Workers are unavailable (e.g. plain http
// on a non-localhost host) MSW falls back to intercepting fetch in the page.
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
