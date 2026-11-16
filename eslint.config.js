// ESLint (flat config): TypeScript, React hooks (incl. the React Compiler-era rules),
// accessibility (jsx-a11y). `npm run lint` must pass in CI.
import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'dist-e2e', 'coverage', 'playwright-report', 'test-results', 'blob-report', 'public/mockServiceWorker.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      // Card bodies and API text are plain text; highlights will be React nodes. Never inject HTML.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Do not render raw HTML (API text is untrusted); build React nodes instead.',
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Checked on the real <input> only (SearchBar), not on every component prop named autoFocus.
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    },
  },
  {
    files: ['*.config.{js,ts}', 'e2e/**/*.ts', 'scripts/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
  },
);
