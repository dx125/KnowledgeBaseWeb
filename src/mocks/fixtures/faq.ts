// SYNTHETIC FIXTURE DATA — for the offline mock backend only.
// Q&A answer cards (ordinary cards under topic.faq_*, content_category "faq") and the
// normalized questions that point at them. Written by hand; no real people, chat messages
// or dataset content. NOT relocation guidance.
//
// Question cases covered:
//  - several phrasings per locale; only phrasings[0] is returned by the API
//  - a spread of ask_frequency values (ranking), across both Q&A topics
//  - two questions sharing one answer card (the data model allows it)
//  - an English-only question (other locales fall back to en)
//  - a question with no phrasings at all (falls back to the answer card's title)
//  - an internal question, and questions whose answer card is internal / not active
//    (both only returned with internal=1)

import type { CardFixture, CardText, QuestionFixture } from './types';

const tx = (title: string, short_body: string, body: string = short_body): CardText => ({
  title,
  short_body,
  body,
});

export const faqCards: CardFixture[] = [
  // --- topic.faq_residency ----------------------------------------------------------------
  {
    card_id: 'card.faq_residency.faq.cedula_wait',
    topic_id: 'topic.faq_residency',
    card_type: 'how_to',
    content_category: 'faq',
    status: 'active',
    visibility: 'public',
    confidence: 'medium_high',
    staleness_risk: 'high',
    needs_review: false,
    sensitivity_tags: ['legal'],
    quality_score: 0.8,
    alignment_score: 0.75,
    search_boost: 0.1,
    last_updated: '2026-09-09T00:00:00Z',
    text: {
      en: tx(
        'How long does it take to get a cédula?',
        'Usually a few weeks after the appointment, but it varies by office and season.',
        'After the appointment the card is usually ready within a few weeks; some offices are faster. You can check the status online with your ID number. If it takes much longer, ask at the office where you applied.',
      ),
      ru: tx(
        'Сколько ждать cédula?',
        'Обычно несколько недель после записи, но зависит от офиса и сезона.',
        'После визита карта обычно готова через несколько недель; в некоторых офисах быстрее. Статус можно проверить онлайн по номеру документа. Если ждёте намного дольше — спросите в офисе, где подавали.',
      ),
      es: tx(
        '¿Cuánto demora la cédula?',
        'Normalmente unas semanas después de la cita, pero depende de la oficina y la época.',
        'Después de la cita la cédula suele estar pronta en unas semanas; algunas oficinas son más rápidas. Podés consultar el estado en línea con tu número de documento. Si demora mucho más, preguntá en la oficina donde hiciste el trámite.',
      ),
      de: tx(
        'Wie lange dauert die Cédula?',
        'Meist ein paar Wochen nach dem Termin, je nach Büro und Saison.',
        'Nach dem Termin ist der Ausweis meist nach wenigen Wochen fertig; manche Büros sind schneller. Den Status kann man online mit der Dokumentnummer prüfen. Dauert es deutlich länger, im Büro der Antragstellung nachfragen.',
      ),
      pt: tx(
        'Quanto tempo leva para tirar a cédula?',
        'Normalmente algumas semanas após o atendimento, mas depende do escritório e da época.',
        'Depois do atendimento, a cédula costuma ficar pronta em algumas semanas; alguns escritórios são mais rápidos. Dá para consultar o status online com o número do documento. Se demorar muito mais, pergunte no escritório onde fez o pedido.',
      ),
    },
    keywords: [{ en: 'cédula' }, { en: 'waiting time', ru: 'срок ожидания', es: 'demora', de: 'Wartezeit' }],
  },
  {
    card_id: 'card.faq_residency.faq.work_while_waiting',
    topic_id: 'topic.faq_residency',
    card_type: 'how_to',
    content_category: 'faq',
    status: 'active',
    visibility: 'public',
    confidence: 'medium',
    staleness_risk: 'medium',
    needs_review: true,
    sensitivity_tags: ['legal'],
    quality_score: 0.7,
    alignment_score: 0.68,
    search_boost: 0,
    last_updated: '2026-08-01T00:00:00Z',
    text: {
      en: tx(
        'Can I work while my residency is in process?',
        'Generally yes, once you have the filing receipt and a provisional cédula — but check your case.',
        'People commonly start formal work with the filing receipt and a provisional cédula. Employers may ask for both. Edge cases (some visa types, regulated professions) differ — this answer needs review.',
      ),
      ru: tx(
        'Можно ли работать, пока рассматривают резиденцию?',
        'Как правило да, если есть квитанция о подаче и временная cédula, — но проверьте свой случай.',
        'Обычно официально начинают работать с квитанцией о подаче и временной cédula. Работодатель может попросить и то, и другое. Особые случаи (некоторые типы виз, регулируемые профессии) отличаются — ответ требует проверки.',
      ),
      es: tx(
        '¿Puedo trabajar mientras sale la residencia?',
        'En general sí, con el comprobante del trámite y la cédula provisoria, pero revisá tu caso.',
        'Es común empezar a trabajar en blanco con el comprobante del trámite y la cédula provisoria. El empleador puede pedir ambos. Los casos especiales (algunas visas, profesiones reguladas) son distintos: esta respuesta necesita revisión.',
      ),
      de: tx(
        'Darf ich arbeiten, während die Residenz läuft?',
        'Meist ja, mit Antragsbestätigung und vorläufiger Cédula — aber den eigenen Fall prüfen.',
        'Üblich ist, mit Antragsbestätigung und vorläufiger Cédula regulär zu arbeiten. Arbeitgeber können beides verlangen. Sonderfälle (bestimmte Visa, regulierte Berufe) weichen ab — diese Antwort muss geprüft werden.',
      ),
    },
  },
  {
    card_id: 'card.faq_residency.faq.travel_during_process',
    topic_id: 'topic.faq_residency',
    card_type: 'how_to',
    content_category: 'faq',
    status: 'needs_review',
    visibility: 'public',
    confidence: 'low',
    staleness_risk: 'high',
    needs_review: true,
    sensitivity_tags: ['legal'],
    quality_score: 0.5,
    alignment_score: 0.47,
    search_boost: 0,
    last_updated: '2026-06-15T00:00:00Z',
    text: {
      en: tx(
        'Can I travel abroad during the residency process?',
        'Many do, but long absences can cause problems; unreviewed.',
        'Short trips are commonly reported without issues. Long absences, or missing a scheduled step while away, may delay or affect the application. Unreviewed — confirm with the migration office before booking.',
      ),
      ru: tx(
        'Можно ли выезжать за границу во время оформления резиденции?',
        'Многие выезжают, но долгое отсутствие может создать проблемы; не проверено.',
        'О коротких поездках обычно пишут без проблем. Долгое отсутствие или пропущенный этап во время поездки могут задержать или повлиять на заявление. Не проверено — уточните в миграционной службе перед покупкой билетов.',
      ),
      es: tx(
        '¿Puedo viajar al exterior durante el trámite?',
        'Muchos lo hacen, pero ausencias largas pueden traer problemas; sin revisar.',
        'Los viajes cortos suelen reportarse sin inconvenientes. Las ausencias largas, o perder un paso agendado mientras estás afuera, pueden demorar o afectar el trámite. Sin revisar: consultá en Migración antes de sacar pasajes.',
      ),
      de: tx(
        'Darf ich während des Verfahrens ins Ausland reisen?',
        'Viele tun es, aber lange Abwesenheit kann Probleme machen; ungeprüft.',
        'Kurze Reisen werden meist ohne Probleme berichtet. Lange Abwesenheit oder ein verpasster Termin können den Antrag verzögern oder beeinflussen. Ungeprüft — vor der Buchung bei der Migrationsbehörde nachfragen.',
      ),
    },
  },

  // --- topic.faq_daily_life ---------------------------------------------------------------
  {
    card_id: 'card.faq_daily_life.faq.mobile_plan',
    topic_id: 'topic.faq_daily_life',
    card_type: 'how_to',
    content_category: 'faq',
    status: 'active',
    visibility: 'public',
    confidence: 'high',
    staleness_risk: 'medium',
    needs_review: false,
    sensitivity_tags: [],
    quality_score: 0.85,
    alignment_score: 0.83,
    search_boost: 0,
    last_updated: '2026-09-25T00:00:00Z',
    text: {
      en: tx(
        'How do I get a local phone number?',
        'Buy a prepaid SIM with your passport; switch to a contract once you have a cédula.',
        'Prepaid SIM cards are sold in shops and kiosks and only need a passport. Monthly contracts usually ask for a cédula and proof of address. Number portability between operators is available.',
      ),
      ru: tx(
        'Как получить местный номер телефона?',
        'Купите предоплаченную SIM по паспорту; на контракт перейдите после получения cédula.',
        'Предоплаченные SIM продаются в магазинах и киосках, нужен только паспорт. Для ежемесячного контракта обычно просят cédula и подтверждение адреса. Перенос номера между операторами возможен.',
      ),
      es: tx(
        '¿Cómo consigo un número de celular local?',
        'Comprá un chip prepago con pasaporte; pasate a un plan cuando tengas cédula.',
        'Los chips prepagos se venden en locales y quioscos y solo piden pasaporte. Los planes mensuales suelen pedir cédula y constancia de domicilio. Se puede portar el número entre operadores.',
      ),
      de: tx(
        'Wie bekomme ich eine lokale Handynummer?',
        'Prepaid-SIM mit Reisepass kaufen; mit Cédula auf einen Vertrag wechseln.',
        'Prepaid-SIMs gibt es in Läden und Kiosken, nur mit Reisepass. Monatsverträge verlangen meist Cédula und Adressnachweis. Rufnummernmitnahme zwischen Anbietern ist möglich.',
      ),
    },
  },
  {
    card_id: 'card.faq_daily_life.faq.bank_without_cedula',
    topic_id: 'topic.faq_daily_life',
    card_type: 'how_to',
    content_category: 'faq',
    status: 'active',
    visibility: 'public',
    confidence: 'medium',
    staleness_risk: 'medium',
    needs_review: false,
    sensitivity_tags: ['financial'],
    quality_score: 0.72,
    alignment_score: 0.7,
    search_boost: 0,
    last_updated: '2026-07-07T00:00:00Z',
    text: {
      en: tx(
        'Can I open a bank account without a cédula?',
        'Sometimes, with a passport and residency paperwork — it depends on the bank.',
        'Some banks accept a passport plus the residency filing receipt, others require the cédula. Ask the specific branch before you go and bring proof of address and income either way.',
      ),
      ru: tx(
        'Можно ли открыть счёт без cédula?',
        'Иногда — с паспортом и бумагами о резиденции; зависит от банка.',
        'Одни банки принимают паспорт и квитанцию о подаче на резиденцию, другие требуют cédula. Уточните в конкретном отделении заранее и в любом случае возьмите подтверждение адреса и дохода.',
      ),
      es: tx(
        '¿Puedo abrir una cuenta sin cédula?',
        'A veces, con pasaporte y el trámite de residencia; depende del banco.',
        'Algunos bancos aceptan pasaporte más el comprobante del trámite de residencia; otros exigen la cédula. Consultá en la sucursal antes de ir y llevá igual constancia de domicilio e ingresos.',
      ),
      de: tx(
        'Kann ich ohne Cédula ein Konto eröffnen?',
        'Manchmal, mit Reisepass und Residenzunterlagen — je nach Bank.',
        'Manche Banken akzeptieren Reisepass plus Antragsbestätigung, andere verlangen die Cédula. Vorher bei der Filiale nachfragen und in jedem Fall Adress- und Einkommensnachweis mitbringen.',
      ),
      pt: tx(
        'Posso abrir conta sem cédula?',
        'Às vezes, com passaporte e os papéis da residência — depende do banco.',
        'Alguns bancos aceitam passaporte mais o comprovante do pedido de residência; outros exigem a cédula. Pergunte na agência antes de ir e leve comprovante de endereço e de renda de qualquer forma.',
      ),
    },
  },
  {
    card_id: 'card.faq_daily_life.faq.tipping',
    topic_id: 'topic.faq_daily_life',
    card_type: 'how_to',
    content_category: 'faq',
    status: 'active',
    visibility: 'internal',
    confidence: 'medium',
    staleness_risk: 'low',
    needs_review: false,
    sensitivity_tags: [],
    quality_score: 0.6,
    alignment_score: 0.64,
    search_boost: 0,
    last_updated: '2026-04-21T00:00:00Z',
    text: {
      en: tx('Is tipping expected?', 'In restaurants, around ten percent is common; elsewhere it is optional.'),
      ru: tx('Принято ли оставлять чаевые?', 'В ресторанах обычно около десяти процентов; в остальных местах — по желанию.'),
    },
  },
];

export const questions: QuestionFixture[] = [
  {
    question_id: 'q.faq_residency.q01_cedula_wait',
    topic_id: 'topic.faq_residency',
    answer_card_id: 'card.faq_residency.faq.cedula_wait',
    ask_frequency: 48,
    status: 'active',
    visibility: 'public',
    phrasings: {
      en: ['How long does it take to get a cédula?', 'How long is the wait for the ID card?', 'When will my cédula be ready?'],
      ru: ['Сколько ждать cédula?', 'Когда будет готова cédula?', 'Сколько делают удостоверение личности?'],
      es: ['¿Cuánto demora la cédula?', '¿Cuándo está pronta la cédula?'],
      de: ['Wie lange dauert die Cédula?', 'Wann ist mein Ausweis fertig?'],
      pt: ['Quanto tempo leva a cédula?', 'Quando a cédula fica pronta?'],
    },
  },
  {
    // Shares its answer card with q01.
    question_id: 'q.faq_residency.q02_cedula_status_check',
    topic_id: 'topic.faq_residency',
    answer_card_id: 'card.faq_residency.faq.cedula_wait',
    ask_frequency: 21,
    status: 'active',
    visibility: 'public',
    phrasings: {
      en: ['How do I check whether my cédula is ready?', 'Is there a status page for the ID card?'],
      ru: ['Как проверить, готова ли cédula?', 'Где посмотреть статус cédula?'],
      es: ['¿Cómo sé si mi cédula está pronta?'],
      de: ['Wie prüfe ich, ob meine Cédula fertig ist?'],
    },
  },
  {
    question_id: 'q.faq_residency.q03_work_while_waiting',
    topic_id: 'topic.faq_residency',
    answer_card_id: 'card.faq_residency.faq.work_while_waiting',
    ask_frequency: 33,
    status: 'active',
    visibility: 'public',
    phrasings: {
      en: ['Can I work while my residency is in process?', 'Am I allowed to work before residency is granted?'],
      ru: ['Можно ли работать во время оформления резиденции?', 'Можно ли работать до одобрения ВНЖ?'],
      es: ['¿Puedo trabajar mientras sale la residencia?'],
      de: ['Darf ich arbeiten, während die Residenz läuft?'],
    },
  },
  {
    // Answer card is needs_review → only with internal=1.
    question_id: 'q.faq_residency.q04_travel_during_process',
    topic_id: 'topic.faq_residency',
    answer_card_id: 'card.faq_residency.faq.travel_during_process',
    ask_frequency: 15,
    status: 'active',
    visibility: 'public',
    phrasings: {
      en: ['Can I leave the country while residency is pending?', 'Can I travel during the residency process?'],
      ru: ['Можно ли уезжать, пока оформляется резиденция?'],
    },
  },
  {
    // English only → every other locale falls back to the English phrasing.
    question_id: 'q.faq_residency.q05_renewal_reminder',
    topic_id: 'topic.faq_residency',
    answer_card_id: 'card.faq_residency.faq.work_while_waiting',
    ask_frequency: 4,
    status: 'active',
    visibility: 'public',
    phrasings: {
      en: ['Do I need to renew my provisional cédula while I wait?'],
    },
  },
  {
    question_id: 'q.faq_daily_life.q01_bank_without_cedula',
    topic_id: 'topic.faq_daily_life',
    answer_card_id: 'card.faq_daily_life.faq.bank_without_cedula',
    ask_frequency: 39,
    status: 'active',
    visibility: 'public',
    phrasings: {
      en: ['Can I open a bank account without a cédula?', 'Which banks accept a passport?'],
      ru: ['Можно ли открыть счёт без cédula?', 'Какие банки открывают счёт по паспорту?'],
      es: ['¿Puedo abrir una cuenta sin cédula?'],
      de: ['Kann ich ohne Cédula ein Konto eröffnen?'],
      pt: ['Posso abrir conta sem cédula?', 'Quais bancos aceitam passaporte?'],
    },
  },
  {
    question_id: 'q.faq_daily_life.q02_mobile_plan',
    topic_id: 'topic.faq_daily_life',
    answer_card_id: 'card.faq_daily_life.faq.mobile_plan',
    ask_frequency: 27,
    status: 'active',
    visibility: 'public',
    phrasings: {
      en: ['How do I get a local phone number?', 'Where can I buy a SIM card?'],
      ru: ['Как получить местный номер?', 'Где купить SIM-карту?'],
      es: ['¿Cómo consigo un número local?', '¿Dónde compro un chip?'],
      de: ['Wie bekomme ich eine lokale Nummer?', 'Wo kaufe ich eine SIM-Karte?'],
    },
  },
  {
    // No phrasings at all → the API falls back to the answer card's title.
    question_id: 'q.faq_daily_life.q03_prepaid_sim',
    topic_id: 'topic.faq_daily_life',
    answer_card_id: 'card.faq_daily_life.faq.mobile_plan',
    ask_frequency: 12,
    status: 'active',
    visibility: 'public',
    phrasings: {},
  },
  {
    // Answer card is internal → only with internal=1.
    question_id: 'q.faq_daily_life.q04_tipping',
    topic_id: 'topic.faq_daily_life',
    answer_card_id: 'card.faq_daily_life.faq.tipping',
    ask_frequency: 9,
    status: 'active',
    visibility: 'public',
    phrasings: {
      en: ['Is tipping expected?', 'How much do people tip?'],
      ru: ['Принято ли оставлять чаевые?'],
    },
  },
  {
    // The question itself is internal and unreviewed → only with internal=1.
    question_id: 'q.faq_daily_life.q05_phone_contract_draft',
    topic_id: 'topic.faq_daily_life',
    answer_card_id: 'card.faq_daily_life.faq.mobile_plan',
    ask_frequency: 2,
    status: 'needs_review',
    visibility: 'internal',
    phrasings: {
      en: ['Draft question: monthly phone contract without a cédula?'],
    },
  },
];
