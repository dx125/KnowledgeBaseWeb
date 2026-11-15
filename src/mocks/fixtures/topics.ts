// SYNTHETIC FIXTURE DATA — for the offline mock backend only.
// Written by hand for development and tests. No real people, names, contact details or
// chat messages, and nothing copied from the real dataset. Content is generic and may be
// inaccurate: it is NOT relocation guidance.
//
// 6 knowledge-base topics + 2 Q&A topics (topic.faq_*). `pt` exists for only three of
// them so the per-row English fallback is visible. topic.pets has no public+active
// cards, so it only shows up with the "internal / unreviewed" toggle on.

import type { TopicFixture } from './types';

export const topics: TopicFixture[] = [
  {
    topic_id: 'topic.residency',
    clean_message_count: 4210,
    sensitivity: 'high',
    text: {
      en: {
        title: 'Residency & documents',
        description: 'Applying for legal residency, the cédula (national ID card) and the paperwork around them.',
      },
      ru: {
        title: 'ВНЖ и документы',
        description: 'Подача на легальную резиденцию, cédula (уругвайское удостоверение личности) и связанные бумаги.',
      },
      es: {
        title: 'Residencia y documentos',
        description: 'Trámite de residencia legal, la cédula de identidad y los papeles relacionados.',
      },
      de: {
        title: 'Aufenthalt & Dokumente',
        description: 'Antrag auf legale Residenz, die Cédula (Personalausweis) und der Papierkram drumherum.',
      },
      pt: {
        title: 'Residência e documentos',
        description: 'Pedido de residência legal, a cédula (documento de identidade) e a papelada relacionada.',
      },
    },
  },
  {
    topic_id: 'topic.banking',
    clean_message_count: 1875,
    sensitivity: 'medium',
    text: {
      en: { title: 'Banking & money', description: 'Opening an account, transfers from abroad and everyday payments.' },
      ru: { title: 'Банки и деньги', description: 'Открытие счёта, переводы из-за рубежа и повседневные платежи.' },
      es: { title: 'Bancos y dinero', description: 'Abrir una cuenta, transferencias desde el exterior y pagos diarios.' },
      de: { title: 'Bank & Geld', description: 'Kontoeröffnung, Überweisungen aus dem Ausland und alltägliche Zahlungen.' },
    },
  },
  {
    topic_id: 'topic.renting',
    clean_message_count: 3302,
    sensitivity: 'medium',
    text: {
      en: { title: 'Renting a home', description: 'Rental guarantees, deposits, contracts and where to look for listings.' },
      ru: { title: 'Аренда жилья', description: 'Гарантии для аренды, депозиты, договоры и где искать объявления.' },
      es: { title: 'Alquilar vivienda', description: 'Garantías de alquiler, depósitos, contratos y dónde buscar avisos.' },
      de: { title: 'Wohnung mieten', description: 'Mietgarantien, Kautionen, Verträge und wo man Angebote findet.' },
      pt: { title: 'Alugar moradia', description: 'Garantias de aluguel, depósitos, contratos e onde procurar anúncios.' },
    },
  },
  {
    topic_id: 'topic.healthcare',
    clean_message_count: 1460,
    sensitivity: 'high',
    text: {
      en: { title: 'Healthcare', description: 'Private health providers vs. the public system, health certificates and emergencies.' },
      ru: { title: 'Медицина', description: 'Частные медицинские кооперативы и госсистема, медсправки и экстренные случаи.' },
      es: { title: 'Salud', description: 'Mutualistas frente al sistema público, carné de salud y emergencias.' },
      de: { title: 'Gesundheit', description: 'Private Anbieter vs. öffentliches System, Gesundheitszeugnis und Notfälle.' },
    },
  },
  {
    topic_id: 'topic.transport',
    clean_message_count: 980,
    sensitivity: 'low',
    text: {
      en: { title: 'Transport & driving', description: 'Buses, transport cards and exchanging a foreign driving licence.' },
      ru: { title: 'Транспорт и вождение', description: 'Автобусы, транспортные карты и обмен иностранных водительских прав.' },
      es: { title: 'Transporte y manejo', description: 'Ómnibus, tarjetas de transporte y canje de la licencia de conducir extranjera.' },
      de: { title: 'Verkehr & Autofahren', description: 'Busse, Fahrkarten und der Umtausch eines ausländischen Führerscheins.' },
    },
  },
  {
    topic_id: 'topic.pets',
    clean_message_count: null,
    sensitivity: null,
    text: {
      en: { title: 'Moving with pets', description: 'Bringing a dog or cat into the country. Draft topic — not reviewed yet.' },
      ru: { title: 'Переезд с животными', description: 'Как ввезти собаку или кошку. Черновая тема — ещё не проверена.' },
      es: { title: 'Mudarse con mascotas', description: 'Ingresar un perro o un gato al país. Tema borrador, sin revisar.' },
      de: { title: 'Umzug mit Haustieren', description: 'Hund oder Katze einführen. Entwurf — noch nicht geprüft.' },
    },
  },

  // --- Q&A topics: their cards are the answers (content_category = faq) -----------------
  {
    topic_id: 'topic.faq_residency',
    clean_message_count: 640,
    sensitivity: 'high',
    text: {
      en: { title: 'Q&A: residency & ID', description: 'Short answers to the most common questions about residency and the cédula.' },
      ru: { title: 'Вопросы: ВНЖ и cédula', description: 'Короткие ответы на самые частые вопросы о резиденции и cédula.' },
      es: { title: 'Preguntas: residencia y cédula', description: 'Respuestas breves a las dudas más comunes sobre residencia y cédula.' },
      de: { title: 'F&A: Aufenthalt & Ausweis', description: 'Kurze Antworten auf die häufigsten Fragen zu Residenz und Cédula.' },
      pt: { title: 'Perguntas: residência e cédula', description: 'Respostas curtas às dúvidas mais comuns sobre residência e cédula.' },
    },
  },
  {
    topic_id: 'topic.faq_daily_life',
    clean_message_count: 512,
    sensitivity: 'low',
    text: {
      en: { title: 'Q&A: daily life', description: 'Phones, banks, tipping and other everyday questions.' },
      ru: { title: 'Вопросы: быт', description: 'Связь, банки, чаевые и другие бытовые вопросы.' },
      es: { title: 'Preguntas: vida diaria', description: 'Teléfono, bancos, propinas y otras dudas cotidianas.' },
      de: { title: 'F&A: Alltag', description: 'Handy, Bank, Trinkgeld und andere Alltagsfragen.' },
    },
  },
];
