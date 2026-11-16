// Vitest's jsdom environment, but keeping Node's own AbortController / AbortSignal.
//
// jsdom brings its own AbortController / AbortSignal, and Vitest makes them the globals.
// Node's fetch and Request (undici) accept only Node's AbortSignal — strictly so since
// Node 24 — so every cancellable request (react-query, the router) failed there with
// "Expected signal to be an instance of AbortSignal". Browsers have a single AbortSignal,
// so the app itself never meets this. Everything else is the stock jsdom environment.
import { builtinEnvironments, type Environment } from 'vitest/environments';

export default {
  name: 'jsdom-node-abort',
  transformMode: 'web',
  async setup(global, options) {
    const { AbortController, AbortSignal } = global; // Node's, before jsdom replaces them
    const env = await builtinEnvironments.jsdom.setup(global, options);
    global.AbortController = AbortController;
    global.AbortSignal = AbortSignal;
    return env;
  },
} satisfies Environment;
