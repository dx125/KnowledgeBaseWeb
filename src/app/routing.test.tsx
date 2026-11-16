// URLs, history and deep links, through the whole app (browser router on jsdom's history).
import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { t } from '../i18n';
import { renderApp, signIn, type User } from '../test/app';
import { api } from '../test/api-url';
import { server } from '../test/server';
import { cardText, questionText, topicTitle } from '../test/fixtures';

const ru = (key: Parameters<typeof t>[1]) => t('ru', key);
const path = () => window.location.pathname + window.location.search;

async function signedInAt(url: string) {
  const app = renderApp(url);
  await signIn(app.user);
  return app;
}

async function back() {
  await act(async () => {
    window.history.back();
    await new Promise((r) => setTimeout(r, 20));
  });
}

async function forward() {
  await act(async () => {
    window.history.forward();
    await new Promise((r) => setTimeout(r, 20));
  });
}

/** Simulate a page reload: drop the app (and its in-memory cache), render again at the same URL. */
function reload() {
  const url = path();
  cleanup();
  return renderApp(url);
}

const grid = () => screen.findByRole('heading', { name: ru('topicsHeading') });
const topicHeading = (id: string, locale: 'ru' | 'en' = 'ru') =>
  screen.findByRole('heading', { level: 2, name: topicTitle(id, locale) });
async function typeSearch(user: User, placeholder: string, text: string) {
  await user.type(screen.getByPlaceholderText(placeholder), text);
  await waitFor(() => expect(new URLSearchParams(window.location.search).get('q')).toBe(text));
}

describe('URLs for every screen', () => {
  it('/ redirects to the last used language (default ru)', async () => {
    renderApp('/');
    await screen.findByRole('heading', { name: ru('signIn') });
    expect(path()).toBe('/ru');

    cleanup();
    localStorage.setItem('kb.locale', 'de');
    renderApp('/');
    await screen.findByRole('heading', { name: t('de', 'signIn') });
    expect(path()).toBe('/de');
  });

  it('topics, Q&A and Q&A topics each have a path', async () => {
    const { user } = await signedInAt('/ru');
    await grid();

    await user.click(screen.getByRole('link', { name: new RegExp(topicTitle('topic.renting')) }));
    await topicHeading('topic.renting');
    expect(path()).toBe('/ru/topics/renting');

    await user.click(screen.getByRole('link', { name: ru('navFaq') }));
    await screen.findByRole('heading', { name: ru('mostAsked') });
    expect(path()).toBe('/ru/faq');

    await user.click(screen.getByRole('heading', { level: 3, name: topicTitle('topic.faq_daily_life') }));
    await topicHeading('topic.faq_daily_life');
    expect(path()).toBe('/ru/faq/topics/faq_daily_life');
  });

  it('topic tiles and section tabs are real links', async () => {
    await signedInAt('/ru');
    await grid();
    expect(screen.getByRole('link', { name: new RegExp(topicTitle('topic.renting')) })).toHaveAttribute(
      'href',
      '/ru/topics/renting',
    );
    expect(screen.getByRole('link', { name: ru('navKnowledge') })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: ru('navFaq') })).toHaveAttribute('href', '/ru/faq');
    expect(screen.getByRole('link', { name: ru('navFaq') })).not.toHaveAttribute('aria-current');
  });
});

describe('back and forward', () => {
  it('move between home, topic and Q&A like a normal site', async () => {
    const { user } = await signedInAt('/ru');
    await grid();
    await user.click(screen.getByRole('heading', { level: 3, name: topicTitle('topic.renting') }));
    await topicHeading('topic.renting');
    await user.click(screen.getByRole('link', { name: ru('navFaq') }));
    await screen.findByRole('heading', { name: ru('mostAsked') });

    await back();
    await topicHeading('topic.renting');
    expect(path()).toBe('/ru/topics/renting');

    await back();
    await grid();
    expect(path()).toBe('/ru');

    await forward();
    await topicHeading('topic.renting');
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('the first search adds one history entry; refining it does not', async () => {
    const { user } = await signedInAt('/ru');
    await grid();
    const box = screen.getByPlaceholderText(ru('searchPlaceholder'));
    await typeSearch(user, ru('searchPlaceholder'), 'депозит');
    await user.clear(box);
    await typeSearch(user, ru('searchPlaceholder'), 'гарантия');
    await screen.findByText(new RegExp(`^\\d+ ${ru('results')}$`));

    await back(); // straight back to the grid, not to 'депозит'
    await grid();
    expect(path()).toBe('/ru');
    expect(screen.getByPlaceholderText(ru('searchPlaceholder'))).toHaveValue('');
  });
});

describe('deep links and reload', () => {
  it('a topic link opened signed out shows the login, then exactly that topic', async () => {
    const { user } = renderApp('/ru/topics/renting');
    await screen.findByRole('heading', { name: ru('signIn') });
    expect(path()).toBe('/ru/topics/renting');

    await signIn(user);
    await topicHeading('topic.renting');
    expect(path()).toBe('/ru/topics/renting');
  });

  it('reload keeps the topic and its search', async () => {
    const { user } = await signedInAt('/ru/topics/renting');
    await topicHeading('topic.renting');
    await typeSearch(user, ru('searchInTopic'), 'выходной');
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
    expect(path()).toBe(`/ru/topics/renting?q=${encodeURIComponent('выходной')}`);

    reload(); // the session is kept in localStorage
    await topicHeading('topic.renting');
    expect(screen.getByPlaceholderText(ru('searchInTopic'))).toHaveValue('выходной');
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
    expect(screen.getByRole('heading', { name: cardText('card.renting.advice.12').title })).toBeInTheDocument();
  });

  it('reload keeps a whole-base search', async () => {
    const { user } = await signedInAt('/ru');
    await grid();
    await typeSearch(user, ru('searchPlaceholder'), 'депозит');
    reload();
    expect(await screen.findByText(new RegExp(`^\\d+ ${ru('results')}$`))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: cardText('card.renting.warning.deposit_scams').title })).toBeInTheDocument();
  });

  it('a Q&A topic link opens its questions', async () => {
    await signedInAt('/ru/faq/topics/faq_residency');
    await topicHeading('topic.faq_residency');
    expect(await screen.findByText(questionText('q.faq_residency.q01_cedula_wait'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ru('navFaq') })).toHaveAttribute('aria-current', 'page');
  });
});

describe('redirects and not found', () => {
  it('a path without a language gets one', async () => {
    await signedInAt('/topics/renting');
    await topicHeading('topic.renting');
    expect(path()).toBe('/ru/topics/renting');
  });

  it('an unknown language prefix is treated as part of the path → not found', async () => {
    await signedInAt('/fr/topics/renting');
    expect(await screen.findByRole('heading', { name: ru('notFoundTitle') })).toBeInTheDocument();
    expect(path()).toBe('/ru/fr/topics/renting');
    expect(screen.getByRole('link', { name: ru('backToTopics') })).toHaveAttribute('href', '/ru');
  });

  it.each(['/ru/topics/does_not_exist', '/ru/topics/Bad-Slug', '/ru/nothing/here'])('%s → not found', async (url) => {
    await signedInAt(url);
    expect(await screen.findByRole('heading', { name: ru('notFoundTitle') })).toBeInTheDocument();
    expect(screen.getByText(ru('notFoundHint'))).toBeInTheDocument();
  });

  it('a Q&A topic under /topics moves to /faq/topics (and back)', async () => {
    await signedInAt('/ru/topics/faq_residency?q=x');
    await topicHeading('topic.faq_residency');
    expect(path()).toBe('/ru/faq/topics/faq_residency?q=x');

    cleanup();
    renderApp('/ru/faq/topics/renting');
    await topicHeading('topic.renting');
    expect(path()).toBe('/ru/topics/renting');
  });

  it('an internal-only topic is not found unless the toggle is on', async () => {
    const { user } = await signedInAt('/ru/topics/pets');
    expect(await screen.findByRole('heading', { name: ru('notFoundTitle') })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: ru('showInternal') }));
    await topicHeading('topic.pets');
  });

  it('switching the toggle off while on an internal-only topic keeps the page (empty)', async () => {
    const { user } = await signedInAt('/ru');
    await grid();
    const toggle = screen.getByRole('checkbox', { name: ru('showInternal') });
    await user.click(toggle);
    await user.click(await screen.findByRole('heading', { level: 3, name: topicTitle('topic.pets') }));
    await topicHeading('topic.pets');
    await screen.findAllByRole('article');

    await user.click(toggle);
    expect(await screen.findByText(ru('noResults'))).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: topicTitle('topic.pets') })).toBeInTheDocument();
  });
});

describe('language in the URL', () => {
  it('switching language swaps the prefix, keeps the page and search, and adds no history entry', async () => {
    const { user } = await signedInAt('/ru/topics/renting?q=%D0%B2%D1%8B%D1%85%D0%BE%D0%B4%D0%BD%D0%BE%D0%B9');
    await topicHeading('topic.renting');
    const entries = window.history.length;

    await user.selectOptions(screen.getByRole('combobox', { name: ru('language') }), 'en');
    await topicHeading('topic.renting', 'en');
    expect(path()).toBe('/en/topics/renting?q=%D0%B2%D1%8B%D1%85%D0%BE%D0%B4%D0%BD%D0%BE%D0%B9');
    expect(window.history.length).toBe(entries);
    expect(document.documentElement.lang).toBe('en');
  });

  it('signed in, a link in another language opens in the account language', async () => {
    const { user } = await signedInAt('/ru');
    await grid();
    await user.selectOptions(screen.getByRole('combobox', { name: ru('language') }), 'en'); // account default → en
    await screen.findByRole('heading', { name: t('en', 'topicsHeading') });

    cleanup();
    renderApp('/de/topics/renting');
    await topicHeading('topic.renting', 'en');
    expect(path()).toBe('/en/topics/renting');
  });

  it('if the profile cannot be loaded, the URL language is used', async () => {
    server.use(http.get(api('/me'), () => HttpResponse.json({ message: 'down' }, { status: 500 })));
    const { user } = renderApp('/en/topics/renting');
    await signIn(user, { locale: 'en' });
    expect(
      await screen.findByRole('heading', { level: 2, name: topicTitle('topic.renting', 'en') }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(path()).toBe('/en/topics/renting');
  });

  it('signed out, the login form follows the URL language and switching it rewrites the URL', async () => {
    const { user } = renderApp('/es/faq');
    expect(await screen.findByRole('heading', { name: t('es', 'signIn') })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: t('es', 'language') }), 'pt');
    expect(await screen.findByRole('heading', { name: t('pt', 'signIn') })).toBeInTheDocument();
    expect(path()).toBe('/pt/faq');
  });

  it('the header title keeps the search on a section home, and goes home from a topic', async () => {
    const { user } = await signedInAt('/ru/faq/topics/faq_daily_life');
    await topicHeading('topic.faq_daily_life');
    const title = screen.getByRole('link', { name: new RegExp(ru('appTitle')) });
    expect(title).toHaveAttribute('href', '/ru/faq');

    await user.click(title);
    await screen.findByRole('heading', { name: ru('mostAsked') });
    await typeSearch(user, ru('searchFaqPlaceholder'), 'cédula');
    // The URL changes first; React renders the new location right after.
    await waitFor(() =>
      expect(screen.getByRole('link', { name: new RegExp(ru('appTitle')) })).toHaveAttribute(
        'href',
        `/ru/faq?q=${encodeURIComponent('cédula')}`,
      ),
    );
    const header = screen.getByRole('banner');
    expect(within(header).getByText(ru('faqSubtitle'))).toBeInTheDocument();
  });
});
