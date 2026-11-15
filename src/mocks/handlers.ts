// All mock request handlers: Supabase Auth (GoTrue) + the KB API.
import { apiHandlers } from './api';
import { authHandlers } from './auth';

export const handlers = [...authHandlers, ...apiHandlers];
