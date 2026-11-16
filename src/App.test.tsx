// Whole-app behaviour tests: what a user sees and does, against the MSW mock backend.
// They were written against the original single-screen App (before routing and
// react-query) and must keep passing unchanged — they are the no-regression contract.
// Only screen text, roles and labels are used; nothing about how screens are built.
import { screen, waitFor, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { t } from './i18n';
import { newEmail, renderApp, signIn, type User } from './test/app';
import { api, authUrl } from './test/api-url';
import { cardText, questionText, topicDescription, topicTitle } from './test/fixtures';
import { recordApiRequests } from './test/requests';
import { server } from './test/server';

const ru = (key: Parameters<typeof t>[1]) => t('ru', key);

/** The <article> of a knowledge-base card, found by its title. */
async function findCard(title: string) {
  const heading = await screen.findByRole('heading', { name: title });
  return heading.closest('article') as HTMLElement;
}

async function openTopic(user: User, topicId: string) {
  // Topic tiles carry the title as an <h3>; the same text can also appear as a badge.
  await user.click(await screen.findByRole('heading', { level: 3, name: topicTitle(topicId) }));
  await screen.findByRole('heading', { level: 2, name: topicTitle(topicId) });
}

async function signedIn(url = '/') {
  const app = renderApp(url);
  await signIn(app.user);
  await screen.findByText(topicTitle('topic.renting'));
  return app;
}

describe('sign-in gate', () => {
  it('shows the login form first, then the knowledge-base topics', async () => {
    const { user } = renderApp();
    expect(await screen.findByRole('heading', { name: ru('signIn') })).toBeInTheDocument();
    expect(screen.queryByText(topicTitle('topic.renting'))).not.toBeInTheDocument();

    await signIn(user);

    expect(await screen.findByRole('heading', { name: ru('topicsHeading') })).toBeInTheDocument();
    for (const id of ['topic.residency', 'topic.banking', 'topic.renting', 'topic.healthcare', 'topic.transport']) {
      expect(screen.getByText(topicTitle(id))).toBeInTheDocument();
    }
    // Q&A topics and internal-only topics are not part of the knowledge-base grid.
    expect(screen.queryByText(topicTitle('topic.faq_residency'))).not.toBeInTheDocument();
    expect(screen.queryByText(topicTitle('topic.pets'))).not.toBeInTheDocument();
    expect(screen.getByText(`5 ${ru('topicsHeading').toLowerCase()}`)).toBeInTheDocument();
  });

  it('makes no API requests before sign-in', async () => {
    const requests = recordApiRequests();
    renderApp();
    await screen.findByRole('heading', { name: ru('signIn') });
    await new Promise((r) => setTimeout(r, 50));
    expect(requests).toEqual([]);
  });

  it('shows an error for bad credentials and stays on the login form', async () => {
    const { user } = renderApp();
    server.use(
      http.post(authUrl('/token'), () =>
        HttpResponse.json({ code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, { status: 400 }),
      ),
    );
    await signIn(user);
    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: ru('signIn') })).toBeInTheDocument();
  });

  it('can create an account (the mock signs it in right away)', async () => {
    const { user } = renderApp();
    await user.click(await screen.findByRole('button', { name: ru('switchToSignUp') }));
    await user.type(screen.getByLabelText(ru('email')), newEmail());
    await user.type(screen.getByLabelText(ru('password')), 'secret1');
    await user.click(screen.getByRole('button', { name: ru('signUp') }));
    expect(await screen.findByText(topicTitle('topic.renting'))).toBeInTheDocument();
  });

  it('signs out back to the login form', async () => {
    const { user } = await signedIn();
    await user.click(screen.getByRole('button', { name: ru('signOut') }));
    expect(await screen.findByRole('heading', { name: ru('signIn') })).toBeInTheDocument();
    expect(screen.queryByText(topicTitle('topic.renting'))).not.toBeInTheDocument();
  });
});

describe('knowledge base', () => {
  it('opens a topic with its description and cards, landing card first, and goes back', async () => {
    const { user } = await signedIn();
    await openTopic(user, 'topic.renting');

    expect(screen.getByText(topicDescription('topic.renting'))).toBeInTheDocument();
    const titles = (await screen.findAllByRole('article')).map((a) => within(a).getByRole('heading').textContent);
    expect(titles).toEqual([
      cardText('card.renting.overview.main').title,
      cardText('card.renting.instruction.guarantee_options').title,
      cardText('card.renting.warning.deposit_scams').title,
      cardText('card.renting.advice.12').title,
      cardText('card.renting.resource_list.listings').title,
    ]);

    await user.click(screen.getByText(ru('backToTopics')));
    expect(await screen.findByRole('heading', { name: ru('topicsHeading') })).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('revisiting a topic is served from the cache', async () => {
    const requests = recordApiRequests();
    const { user } = await signedIn();
    await openTopic(user, 'topic.renting');
    await screen.findAllByRole('article');
    await user.click(screen.getByText(ru('backToTopics')));
    await openTopic(user, 'topic.renting');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(requests.filter((r) => r.path === '/topics/topic.renting/cards')).toHaveLength(1);
    expect(requests.filter((r) => r.path === '/topics')).toHaveLength(1);
  });

  it('the header title also returns home from a topic', async () => {
    const { user } = await signedIn();
    await openTopic(user, 'topic.banking');
    await user.click(screen.getByText(ru('appTitle')));
    expect(await screen.findByRole('heading', { name: ru('topicsHeading') })).toBeInTheDocument();
  });

  it('searches within a topic and shows the empty state when nothing matches', async () => {
    const { user } = await signedIn();
    await openTopic(user, 'topic.renting');
    await screen.findAllByRole('article');

    const box = screen.getByPlaceholderText(ru('searchInTopic'));
    await user.type(box, 'выходной');
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
    expect(screen.getByRole('heading', { name: cardText('card.renting.advice.12').title })).toBeInTheDocument();

    await user.clear(box);
    await user.type(box, 'zzzzqqq');
    expect(await screen.findByText(ru('noResults'))).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('searches the whole base from home, with topic labels, and clearing returns to topics', async () => {
    const { user } = await signedIn();
    const box = screen.getByPlaceholderText(ru('searchPlaceholder'));
    await user.type(box, 'депозит');

    expect(await screen.findByText(new RegExp(`^\\d+ ${ru('results')}$`))).toBeInTheDocument();
    const card = await findCard(cardText('card.renting.warning.deposit_scams').title);
    expect(within(card).getByText(topicTitle('topic.renting'))).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: ru('topicsHeading') })).not.toBeInTheDocument();

    await user.clear(box);
    expect(await screen.findByRole('heading', { name: ru('topicsHeading') })).toBeInTheDocument();

    await user.type(box, 'zzzzqqq');
    expect(await screen.findByText(ru('noResults'))).toBeInTheDocument();
  });

  it('expands a card body with "read more"', async () => {
    const { user } = await signedIn();
    await openTopic(user, 'topic.renting');
    const text = cardText('card.renting.overview.main');
    const card = await findCard(text.title);

    expect(within(card).getByText(text.short_body)).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: ru('readMore') }));
    expect(within(card).getByText(text.body)).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: ru('readLess') }));
    expect(within(card).getByText(text.short_body)).toBeInTheDocument();
  });

  it('loads related terms, organisations and resources on demand', async () => {
    const { user } = await signedIn();
    await openTopic(user, 'topic.renting');

    const card = await findCard(cardText('card.renting.instruction.guarantee_options').title);
    await user.click(within(card).getByRole('button', { name: new RegExp(ru('relatedInfo')) }));
    expect(await within(card).findByText('Гарантия (garantía)')).toBeInTheDocument();
    expect(within(card).getByText('Страховщики арендных гарантий')).toBeInTheDocument();
    // No Russian text for this resource → the API falls back to English.
    expect(within(card).getByRole('link', { name: 'Rental guarantee comparison (sample link)' })).toHaveAttribute(
      'href',
      'https://example.org/mock/rental-guarantees',
    );

    const plain = await findCard(cardText('card.renting.advice.12').title);
    await user.click(within(plain).getByRole('button', { name: new RegExp(ru('relatedInfo')) }));
    expect(await within(plain).findByText(ru('noRelated'))).toBeInTheDocument();
  });

  it('shows internal / unreviewed topics and cards only with the toggle on', async () => {
    const { user } = await signedIn();
    expect(screen.queryByText(topicTitle('topic.pets'))).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: ru('showInternal') }));
    await openTopic(user, 'topic.pets');

    const card = await findCard(cardText('card.pets.overview.main').title);
    expect(within(card).getByText(ru('internalBadge'))).toBeInTheDocument();
    expect(within(card).getByText(ru('statusReview'))).toBeInTheDocument();
  });

  it('shows API errors', async () => {
    server.use(
      http.get(api('/topics'), () => HttpResponse.json({ error: 'boom', message: 'exploded' }, { status: 500 })),
    );
    const { user } = renderApp();
    await signIn(user);
    expect(await screen.findByText('API 500: exploded', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText(`${ru('errorTitle')}:`)).toBeInTheDocument();
  });
});

describe('Q&A', () => {
  async function openQa(user: User) {
    await user.click(screen.getByText(ru('navFaq')));
    await screen.findByRole('heading', { name: ru('mostAsked') });
  }

  it('lists the most asked questions by frequency, and expands an answer', async () => {
    const { user } = await signedIn();
    await openQa(user);

    const section = screen.getByRole('heading', { name: ru('mostAsked') }).closest('section') as HTMLElement;
    const questions = within(section)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(questions[0]).toContain(questionText('q.faq_residency.q01_cedula_wait'));
    expect(questions[1]).toContain(questionText('q.faq_daily_life.q01_bank_without_cedula'));
    // Internal / unreviewed answers are left out by default.
    expect(within(section).queryByText(questionText('q.faq_daily_life.q04_tipping'))).not.toBeInTheDocument();

    const first = within(section).getAllByRole('button')[0];
    expect(first).toHaveAttribute('aria-expanded', 'false');
    await user.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(within(section).getByText(cardText('card.faq_residency.faq.cedula_wait').body)).toBeInTheDocument();
    expect(within(section).getByText(ru('needsReviewNote'))).toBeInTheDocument();
  });

  it('shows Q&A topics only, and a Q&A topic lists its questions', async () => {
    const { user } = await signedIn();
    await openQa(user);

    expect(screen.getByRole('heading', { name: ru('browseByTopic') })).toBeInTheDocument();
    expect(screen.queryByText(topicTitle('topic.renting'))).not.toBeInTheDocument();
    expect(screen.getByText(`2 ${ru('faqTopicsHeading').toLowerCase()}`)).toBeInTheDocument();

    await openTopic(user, 'topic.faq_daily_life');
    expect(await screen.findByText(questionText('q.faq_daily_life.q01_bank_without_cedula'))).toBeInTheDocument();
    expect(screen.getByText(questionText('q.faq_daily_life.q02_mobile_plan'))).toBeInTheDocument();
    // No phrasing → the answer card's title stands in for the question.
    expect(screen.getByText(questionText('q.faq_daily_life.q03_prepaid_sim'))).toBeInTheDocument();
    expect(screen.queryByText(questionText('q.faq_residency.q01_cedula_wait'))).not.toBeInTheDocument();

    const box = screen.getByPlaceholderText(ru('searchInFaqTopic'));
    await user.type(box, 'zzzzqqq');
    expect(await screen.findByText(ru('noResults'))).toBeInTheDocument();

    await user.click(screen.getByText(ru('backToFaqTopics')));
    expect(await screen.findByRole('heading', { name: ru('browseByTopic') })).toBeInTheDocument();
  });

  it('searches Q&A answers only', async () => {
    const { user } = await signedIn();
    await openQa(user);
    await user.type(screen.getByPlaceholderText(ru('searchFaqPlaceholder')), 'cédula');

    expect(await screen.findByText(new RegExp(`^\\d+ ${ru('results')}$`))).toBeInTheDocument();
    expect(screen.getByText(cardText('card.faq_residency.faq.cedula_wait').title)).toBeInTheDocument();
    // The knowledge-base card about cédula appointments is not a Q&A answer.
    expect(screen.queryByText(cardText('card.residency.instruction.cedula_appointment').title)).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('switching sections resets the search', async () => {
    const { user } = await signedIn();
    await user.type(screen.getByPlaceholderText(ru('searchPlaceholder')), 'депозит');
    await screen.findByText(new RegExp(`^\\d+ ${ru('results')}$`));

    await openQa(user);
    expect(screen.getByPlaceholderText(ru('searchFaqPlaceholder'))).toHaveValue('');

    await user.click(screen.getByText(ru('navKnowledge')));
    expect(await screen.findByRole('heading', { name: ru('topicsHeading') })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(ru('searchPlaceholder'))).toHaveValue('');
  });
});

describe('language', () => {
  it('switches UI and content language, and keeps the open topic', async () => {
    const { user } = await signedIn();
    await openTopic(user, 'topic.renting');

    await user.selectOptions(screen.getByRole('combobox', { name: ru('language') }), 'en');

    expect(await screen.findByRole('heading', { name: cardText('card.renting.overview.main', 'en').title })).toBeInTheDocument();
    expect(screen.getByText(t('en', 'backToTopics'))).toBeInTheDocument();
    // The topic heading follows too (the pre-refactor app kept it in the old language).
    expect(await screen.findByRole('heading', { level: 2, name: topicTitle('topic.renting', 'en') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t('en', 'signOut') })).toBeInTheDocument();
  });

  it('marks the document language (<html lang>) from the start', async () => {
    localStorage.setItem('kb.locale', 'de');
    const { user } = renderApp();
    await screen.findByRole('heading', { name: t('de', 'signIn') });
    expect(document.documentElement.lang).toBe('de');

    await signIn(user, { locale: 'de' });
    await screen.findByText(topicTitle('topic.renting'));
    expect(document.documentElement.lang).toBe('ru'); // the new account's default
  });

  it('saves the choice as the account default and adopts it at the next sign-in', async () => {
    const { user } = await signedIn();
    const email = screen.getByText(/@example\.test$/).textContent!;
    await user.selectOptions(screen.getByRole('combobox', { name: ru('language') }), 'en');
    expect(await screen.findByText(topicTitle('topic.renting', 'en'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: t('en', 'signOut') }));
    // Pick another language on the login screen: the account default still wins.
    await user.selectOptions(await screen.findByRole('combobox', { name: t('en', 'language') }), 'de');
    await signIn(user, { email, locale: 'de' });

    expect(await screen.findByText(topicTitle('topic.renting', 'en'))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('en', 'topicsHeading') })).toBeInTheDocument();
  });

  it("a new account's default language (ru) replaces the one chosen before sign-in", async () => {
    localStorage.setItem('kb.locale', 'en');
    const { user } = renderApp();
    expect(await screen.findByRole('heading', { name: t('en', 'signIn') })).toBeInTheDocument();
    await signIn(user, { locale: 'en' });
    expect(await screen.findByText(topicTitle('topic.renting', 'ru'))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: ru('topicsHeading') })).toBeInTheDocument();
  });

  // Regression test for a race in the pre-refactor app: the profile request from sign-in
  // resolved after the user had picked a language and switched the UI back.
  it('a slow profile response does not undo a language switch made meanwhile', async () => {
    server.use(
      http.get(api('/me'), async () => {
        await delay(300);
        return HttpResponse.json({ user_id: 'u1', email: 'x@example.test', default_locale: 'ru' });
      }),
    );
    const { user } = renderApp();
    await signIn(user);
    await user.selectOptions(await screen.findByRole('combobox', { name: ru('language') }, { timeout: 2000 }), 'en');
    expect(await screen.findByText(topicTitle('topic.renting', 'en'))).toBeInTheDocument();

    await new Promise((r) => setTimeout(r, 500)); // the slow profile response has arrived by now
    expect(screen.getByText(topicTitle('topic.renting', 'en'))).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: t('en', 'language') })).toHaveValue('en');
  });
});
