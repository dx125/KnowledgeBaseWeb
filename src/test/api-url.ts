// URLs of the mock backend, for per-test `server.use(...)` overrides.
import { AUTH_BASE, KB_BASE } from '../mocks/config';

export const api = (path: string) => `${KB_BASE}${path}`;
export const authUrl = (path: string) => `${AUTH_BASE}${path}`;
