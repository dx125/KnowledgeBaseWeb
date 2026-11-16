// axe-core on every screen and state of the app (jsdom: structure, names, ARIA, landmarks,
// headings). Colour contrast is checked in the browser: e2e/a11y.spec.ts.
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { t } from '../i18n';
import { api, authUrl } from '../test/api-url';
import { renderApp, signIn, type User } from '../test/app';
import { expectNoAxeViolations } from '../test/axe';
import { cardText, topicTitle } from '../test/fixtures';
import { server } from '../test/server';

const ru = (key: Parameters<typeof t>[1]) => t('ru', key);

async function signedInAt(url: string) {
  const app = renderApp(url);
  await signIn(app.user);
  await screen.findByRole('button', { name: ru('signOut') });
  return app;
}

/** Navigate by "reloading" at a URL; the session from the earlier sign-in is kept. */
async function visit(url: string, locale: 'ru' | 'de' = 'ru') {
  cleanup();
  const app = renderApp(url);
  await screen.findByRole('button', { name: t(locale, 'signOut') });
  return app;
}

async function openRelated(user: User, cardTitle: string) {
  const card = (await screen.findByRole('heading', { name: cardTitle })).closest('article') as HTMLElement;
  await user.click(within(card).getByRole('button', { name: new RegExp(ru('relatedInfo')) }));
  return card;
}

describe('accessibility (axe)', () => {
  it('login: sign-in, sign-up and a failed attempt', async () => {
    const { user } = renderApp('/ru');
    await screen.findByRole('heading', { name: ru('signIn') });
    await expectNoAxeViolations();

    server.use(
      http.post(authUrl('/token'), () =>
        HttpResponse.json({ code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, { status: 400 }),
      ),
    );
    await signIn(user);
    await screen.findByText('Invalid login credentials');
    await expectNoAxeViolations();

    await user.click(screen.getByRole('button', { name: ru('switchToSignUp') }));
    await screen.findByRole('heading', { name: ru('signUp') });
    await expectNoAxeViolations();
  });

  it('knowledge-base home, with the internal toggle on', async () => {
    const { user } = await signedInAt('/ru');
    await screen.findByRole('heading', { level: 3, name: topicTitle('topic.renting') });
    await expectNoAxeViolations();

    await user.click(screen.getByRole('checkbox', { name: ru('showInternal') }));
    await screen.findByRole('heading', { level: 3, name: topicTitle('topic.pets') });
    await expectNoAxeViolations();
  });

  it('search results and the empty state', async () => {
    await signedInAt(`/ru?q=${encodeURIComponent('депозит')}`);
    await screen.findByText(new RegExp(`^\\d+ ${ru('results')}$`));
    await expectNoAxeViolations();

    await visit('/ru?q=zzzzqqq');
    await screen.findByText(ru('noResults'));
    await expectNoAxeViolations();
  });

  it('topic: cards with read more, related context, no related terms, badges', async () => {
    const { user } = await signedInAt('/ru/topics/renting');
    const overview = (await screen.findByRole('heading', { name: cardText('card.renting.overview.main').title }))
      .closest('article') as HTMLElement;
    await user.click(within(overview).getByRole('button', { name: ru('readMore') }));
    await openRelated(user, cardText('card.renting.instruction.guarantee_options').title);
    await screen.findByText('Гарантия (garantía)');
    const plain = await openRelated(user, cardText('card.renting.advice.12').title);
    await within(plain).findByText(ru('noRelated'));
    await expectNoAxeViolations();

    await user.click(screen.getByRole('checkbox', { name: ru('showInternal') }));
    await user.click(screen.getByRole('link', { name: ru('backToTopics') }));
    await user.click(await screen.findByRole('heading', { level: 3, name: topicTitle('topic.pets') }));
    await screen.findByText(ru('internalBadge'));
    await expectNoAxeViolations();
  });

  it('Q&A: most asked (expanded), a Q&A topic, Q&A search', async () => {
    const { user } = await signedInAt('/ru/faq');
    await screen.findByRole('heading', { name: ru('mostAsked') });
    await user.click(screen.getAllByRole('button', { expanded: false })[0]);
    await expectNoAxeViolations();

    await user.click(screen.getByRole('heading', { level: 3, name: topicTitle('topic.faq_daily_life') }));
    await screen.findByRole('heading', { level: 2, name: topicTitle('topic.faq_daily_life') });
    await waitFor(() => expect(screen.getAllByRole('button', { expanded: false }).length).toBeGreaterThan(0));
    await expectNoAxeViolations();

    await user.click(screen.getByRole('link', { name: ru('backToFaqTopics') }));
    await user.type(await screen.findByPlaceholderText(ru('searchFaqPlaceholder')), 'cédula');
    await screen.findByText(new RegExp(`^\\d+ ${ru('results')}$`));
    await expectNoAxeViolations();
  });

  it('not found, another language, and an API error', async () => {
    const { user } = await signedInAt('/ru/topics/does_not_exist');
    await screen.findByRole('heading', { name: ru('notFoundTitle') });
    await expectNoAxeViolations();

    await user.selectOptions(screen.getByRole('combobox', { name: ru('language') }), 'de');
    await screen.findByRole('heading', { name: t('de', 'notFoundTitle') });
    await expectNoAxeViolations();

    server.use(http.get(api('/topics'), () => HttpResponse.json({ message: 'exploded' }, { status: 500 })));
    await visit('/de', 'de');
    await screen.findByText('API 500: exploded', {}, { timeout: 4000 });
    await expectNoAxeViolations();
  });
});
