import { describe, expect, it } from 'vitest';
import { topics } from '../mocks/fixtures';
import { homePath, isLocale, splitLang, swapLang, topicIdFromSlug, topicPath, topicSlug } from './paths';

describe('topic slugs', () => {
  it('round-trips every fixture topic id', () => {
    for (const { topic_id } of topics) {
      expect(topicIdFromSlug(topicSlug(topic_id))).toBe(topic_id);
    }
  });

  it('drops the topic. prefix', () => {
    expect(topicSlug('topic.residency_cedula_immigration')).toBe('residency_cedula_immigration');
    expect(topicSlug('topic.faq_daily_life')).toBe('faq_daily_life');
  });

  it.each([undefined, '', 'Renting', 'a/b', '..', 'a b', 'topic.renting', 'a-b', 'x%2Fy', 'ü'])(
    'rejects %j',
    (slug) => {
      expect(topicIdFromSlug(slug)).toBeNull();
    },
  );
});

describe('path builders', () => {
  it('builds section homes', () => {
    expect(homePath('ru')).toBe('/ru');
    expect(homePath('en', 'faq')).toBe('/en/faq');
    expect(homePath('de', 'kb', 'cédula & co')).toBe('/de?q=c%C3%A9dula+%26+co');
  });

  it('puts Q&A topics under /faq', () => {
    expect(topicPath('ru', 'topic.renting')).toBe('/ru/topics/renting');
    expect(topicPath('es', 'topic.faq_residency')).toBe('/es/faq/topics/faq_residency');
    expect(topicPath('pt', 'topic.renting', 'garantia')).toBe('/pt/topics/renting?q=garantia');
  });
});

describe('language prefix', () => {
  it('recognises only supported locales', () => {
    expect(['ru', 'en', 'es', 'de', 'pt'].every(isLocale)).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('EN')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('splits the prefix from the rest', () => {
    expect(splitLang('/ru')).toEqual({ lang: 'ru', rest: '' });
    expect(splitLang('/ru/')).toEqual({ lang: 'ru', rest: '/' });
    expect(splitLang('/en/faq/topics/faq_residency')).toEqual({ lang: 'en', rest: '/faq/topics/faq_residency' });
    expect(splitLang('/')).toEqual({ lang: null, rest: '' });
    expect(splitLang('/topics/renting')).toEqual({ lang: null, rest: '/topics/renting' });
    expect(splitLang('/fr/topics')).toEqual({ lang: null, rest: '/fr/topics' });
  });

  it('swaps the language and keeps path, query and hash', () => {
    expect(swapLang({ pathname: '/ru/topics/renting', search: '?q=x', hash: '#top' }, 'en')).toBe(
      '/en/topics/renting?q=x#top',
    );
    expect(swapLang({ pathname: '/ru' }, 'de')).toBe('/de');
    expect(swapLang({ pathname: '/topics/renting' }, 'pt')).toBe('/pt/topics/renting');
    expect(swapLang({ pathname: '/' }, 'es')).toBe('/es');
  });
});
