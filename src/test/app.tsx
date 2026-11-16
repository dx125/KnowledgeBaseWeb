// Helpers for whole-app tests: render <App /> at a URL and sign in through the UI.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onTestFinished } from 'vitest';
import App, { createAppRouter } from '../App';
import { t, type Locale } from '../i18n';

export type User = ReturnType<typeof userEvent.setup>;

let seq = 0;
/** A fresh account per test: the mock keys stored profiles (default locale) by email. */
export const newEmail = () => `tester${++seq}@example.test`;

/** Render the whole app at `url`, with its own router (disposed when the test ends). */
export function renderApp(url = '/') {
  window.history.replaceState(null, '', url);
  const router = createAppRouter();
  onTestFinished(() => router.dispose());
  const user = userEvent.setup();
  return { user, router, ...render(<App router={router} />) };
}

/** Fill in and submit the login form. The mock accepts any email with a 6+ char password. */
export async function signIn(
  user: User,
  { email = newEmail(), locale = 'ru' as Locale }: { email?: string; locale?: Locale } = {},
) {
  await user.type(await screen.findByLabelText(t(locale, 'email')), email);
  await user.type(screen.getByLabelText(t(locale, 'password')), 'secret1');
  await user.click(screen.getByRole('button', { name: t(locale, 'signIn') }));
  return email;
}
