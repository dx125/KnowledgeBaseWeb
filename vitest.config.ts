import { loadEnv } from 'vite';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Unit, component and integration tests (jsdom + React Testing Library).
// The backend is the same MSW mock that `npm run dev:mock` uses (src/mocks), served in
// Node by src/test/server.ts, so tests need the dummy values from the committed .env.mock.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // jsdom, keeping Node's AbortController/AbortSignal (see the file for why).
      environment: './src/test/jsdom-environment.ts',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
      env: loadEnv('mock', process.cwd(), 'VITE_'),
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/mocks/**', 'src/main.tsx', 'src/vite-env.d.ts'],
        reporter: ['text-summary', 'text', 'html'],
        // CI fails below these (current: ~98 % lines, ~94 % branches). Raise, don't lower.
        thresholds: { lines: 95, statements: 95, functions: 95, branches: 90 },
      },
    },
  }),
);
