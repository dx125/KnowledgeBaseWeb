import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { t, type Locale } from '../i18n';
import { api } from '../test/api-url';
import { recordApiRequests } from '../test/requests';
import { server } from '../test/server';
import { createTestQueryClient, signInDirect } from '../test/session';
import { expectNoAxeViolations } from '../test/axe';
import { CardItem, type CardView } from './CardItem';

const card: CardView = {
  card_id: 'card.renting.instruction.guarantee_options',
  card_type: 'how_to',
  status: 'active',
  visibility: 'public',
  title: 'Rental guarantee options compared',
  short_body: 'Short text.',
  body: 'Long text.',
  confidence: 'medium_high',
  staleness_risk: 'medium',
  needs_review: false,
  alignment_score: 0.8,
  last_updated: '2026-07-25T00:00:00Z',
  topic_title: 'Renting a home',
};

function renderCard(props: Partial<CardView> = {}, locale: Locale = 'en') {
  const client = createTestQueryClient();
  const ui = (l: Locale) => (
    <QueryClientProvider client={client}>
      <CardItem card={{ ...card, ...props }} locale={l} />
    </QueryClientProvider>
  );
  const view = render(ui(locale));
  return { ...view, user: userEvent.setup(), setLocale: (l: Locale) => view.rerender(ui(l)) };
}

beforeEach(async () => {
  await signInDirect();
});

describe('CardItem', () => {
  it('shows title, topic, trust signals and the update date', () => {
    renderCard();
    const article = screen.getByRole('article');
    expect(within(article).getByRole('heading', { name: card.title! })).toBeInTheDocument();
    expect(within(article).getByText('Renting a home')).toBeInTheDocument();
    expect(within(article).getByText(`${t('en', 'confidence')}: medium high`)).toBeInTheDocument();
    expect(within(article).getByText(`${t('en', 'staleness')}: medium`)).toBeInTheDocument();
    expect(within(article).getByText(`${t('en', 'updated')}: 2026-07-25`)).toBeInTheDocument();
  });

  it('flags internal, unreviewed and weakly supported cards', () => {
    renderCard({ visibility: 'internal', status: 'needs_expert_review', needs_review: true, alignment_score: 0.3 });
    expect(screen.getByText(t('en', 'internalBadge'))).toBeInTheDocument();
    expect(screen.getByText(t('en', 'statusExpert'))).toBeInTheDocument();
    expect(screen.getByText(t('en', 'needsExpertNote'))).toBeInTheDocument();
    expect(screen.getByText(t('en', 'limitedEvidence'))).toBeInTheDocument();
  });

  it('has no "read more" when the body adds nothing', () => {
    renderCard({ body: 'Short text.' });
    expect(screen.queryByRole('button', { name: t('en', 'readMore') })).not.toBeInTheDocument();
  });

  it('fetches related context only when opened, once per card and locale', async () => {
    const requests = recordApiRequests();
    const { user } = renderCard();
    expect(requests).toEqual([]);

    const toggle = screen.getByRole('button', { name: new RegExp(t('en', 'relatedInfo')) });
    await user.click(toggle);
    expect(await screen.findByText('Rental guarantee (garantía)')).toBeInTheDocument();
    expect(screen.getByText(t('en', 'glossaryLabel'))).toBeInTheDocument();
    expect(screen.getByText(t('en', 'entitiesLabel'))).toBeInTheDocument();
    expect(screen.getByText(t('en', 'resourcesLabel'))).toBeInTheDocument();

    await user.click(toggle); // close
    expect(screen.queryByText('Rental guarantee (garantía)')).not.toBeInTheDocument();
    await user.click(toggle); // reopen: from cache
    expect(screen.getByText('Rental guarantee (garantía)')).toBeInTheDocument();
    expect(requests.filter((r) => r.path.startsWith('/cards/'))).toHaveLength(1);
  });

  it('opens at once and shows a loading line while fetching', async () => {
    server.use(
      http.get(api('/cards/:id'), async () => {
        await delay(100);
        return HttpResponse.json({ card: { card_id: card.card_id, glossary: [{ term: 'T', definition: null }], entities: [] } });
      }),
    );
    const { user } = renderCard();
    await user.click(screen.getByRole('button', { name: new RegExp(t('en', 'relatedInfo')) }));
    expect(screen.getByText(t('en', 'loading'))).toBeInTheDocument();
    expect(await screen.findByText('T')).toBeInTheDocument();
    expect(screen.queryByText(t('en', 'loading'))).not.toBeInTheDocument();
  });

  it('closes the panel when the language changes', async () => {
    const { user, setLocale } = renderCard();
    await user.click(screen.getByRole('button', { name: new RegExp(t('en', 'relatedInfo')) }));
    await screen.findByText('Rental guarantee (garantía)');

    setLocale('ru');
    expect(screen.queryByText('Rental guarantee (garantía)')).not.toBeInTheDocument();
    expect(screen.queryByText('Гарантия (garantía)')).not.toBeInTheDocument();
  });

  it('a failed lookup reads as "no related terms"', async () => {
    const { user } = renderCard({ card_id: 'card.unknown.x.y' });
    await user.click(screen.getByRole('button', { name: new RegExp(t('en', 'relatedInfo')) }));
    expect(await screen.findByText(t('en', 'noRelated'))).toBeInTheDocument();
  });

  it('is accessible in every state: badges, expanded body, related panel open', async () => {
    const { container, user } = renderCard({
      visibility: 'internal',
      status: 'needs_expert_review',
      needs_review: true,
      alignment_score: 0.3,
    });
    await expectNoAxeViolations(container, { component: true });
    await user.click(screen.getByRole('button', { name: t('en', 'readMore') }));
    await user.click(screen.getByRole('button', { name: new RegExp(t('en', 'relatedInfo')) }));
    await screen.findByText('Rental guarantee (garantía)');
    await expectNoAxeViolations(container, { component: true });
  });
});
