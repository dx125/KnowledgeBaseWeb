// SYNTHETIC FIXTURE DATA — for the offline mock backend only.
// Written by hand for development and tests. No real people, names, contact details or
// chat messages, and nothing copied from the real dataset. Organisations are referred to
// generically, and every resource URL points at example.org. Content may be inaccurate:
// it is NOT relocation guidance.
//
// Coverage this file is responsible for (the Q&A answer cards are in faq.ts):
//  - every card_type (summary / public_overview / how_to) and content_category
//  - every status (active / needs_review / needs_expert_review) and visibility
//  - every badge in components/Badges.tsx: confidence high / medium_high / medium / low /
//    null / an unknown value (fallback style); staleness low / medium / high / null /
//    unknown; the needs_review flag; "limited evidence" (alignment_score < 0.5)
//  - glossary / entities / resources on some cards only, incl. a resource with url: null
//  - an id with a numeric tail (card.residency.advice.40), bodies from one line to ≥ 5k
//    characters, "•" bullet text, accented words (cédula, Führerschein) for search
//  - translations: ru/en/es/de on most cards, pt on a minority; a few cards are en+ru only

import type { CardFixture, CardText } from './types';
import { longChecklistEn, longChecklistRu } from './long-checklist';

/** Card text; `body` defaults to `short_body` (then the UI shows no "Read more"). */
const tx = (title: string, short_body: string, body: string = short_body): CardText => ({
  title,
  short_body,
  body,
});

const PUBLIC_ACTIVE = { status: 'active', visibility: 'public' } as const;

export const kbCards: CardFixture[] = [
  // --- topic.residency --------------------------------------------------------------------
  {
    card_id: 'card.residency.overview.main',
    topic_id: 'topic.residency',
    card_type: 'summary',
    content_category: 'overview',
    ...PUBLIC_ACTIVE,
    confidence: 'high',
    staleness_risk: 'low',
    needs_review: false,
    sensitivity_tags: ['legal'],
    quality_score: 0.95,
    alignment_score: 0.92,
    search_boost: 0.5,
    last_updated: '2026-09-30T00:00:00Z',
    text: {
      en: tx(
        'Residency in Uruguay: overview',
        'Two main routes — temporary and permanent residency. Both start with an application at the migration office; the cédula follows.',
        'Most newcomers apply either for temporary residency (tied to work, study or a regional agreement) or for permanent residency. Both start with an application and a document check; once the file is open you can usually request a cédula, the national ID card. Processing times vary a lot, from weeks to many months. Keep copies of everything and check the official site — rules change.',
      ),
      ru: tx(
        'Резиденция в Уругвае: обзор',
        'Два основных пути — временная и постоянная резиденция. Оба начинаются с подачи в миграционную службу, потом — cédula.',
        'Большинство приезжающих подаются либо на временную резиденцию (работа, учёба или региональное соглашение), либо на постоянную. В обоих случаях сначала подача и проверка документов; после открытия дела обычно можно получить cédula — удостоверение личности. Сроки рассмотрения очень разные: от недель до многих месяцев. Храните копии всех бумаг и проверяйте официальный сайт — правила меняются.',
      ),
      es: tx(
        'Residencia en Uruguay: panorama',
        'Dos caminos principales: residencia temporaria y permanente. Ambos empiezan con un trámite en Migración; después llega la cédula.',
        'La mayoría de quienes llegan solicitan residencia temporaria (por trabajo, estudio o acuerdo regional) o permanente. En los dos casos el trámite empieza con la solicitud y la revisión de documentos; con el expediente abierto normalmente se puede pedir la cédula de identidad. Los plazos varían mucho, de semanas a varios meses. Guardá copias de todo y revisá el sitio oficial: las reglas cambian.',
      ),
      de: tx(
        'Aufenthalt in Uruguay: Überblick',
        'Zwei Hauptwege — befristete und dauerhafte Residenz. Beide beginnen mit einem Antrag bei der Migrationsbehörde; danach folgt die Cédula.',
        'Die meisten Neuankömmlinge beantragen entweder eine befristete Residenz (Arbeit, Studium oder regionales Abkommen) oder eine dauerhafte. In beiden Fällen stehen Antrag und Dokumentenprüfung am Anfang; ist die Akte eröffnet, kann man meist die Cédula, den Personalausweis, beantragen. Die Bearbeitungszeiten schwanken stark, von Wochen bis zu vielen Monaten. Kopien aufbewahren und die offizielle Website prüfen — Regeln ändern sich.',
      ),
      pt: tx(
        'Residência no Uruguai: visão geral',
        'Dois caminhos principais — residência temporária e permanente. Ambos começam com um pedido na migração; depois vem a cédula.',
        'A maioria de quem chega pede residência temporária (trabalho, estudo ou acordo regional) ou permanente. Nos dois casos o processo começa com o pedido e a conferência de documentos; com o processo aberto, normalmente é possível pedir a cédula de identidade. Os prazos variam muito, de semanas a vários meses. Guarde cópias de tudo e consulte o site oficial — as regras mudam.',
      ),
    },
    keywords: [
      { en: 'residency', ru: 'резиденция', es: 'residencia', de: 'Aufenthalt', pt: 'residência' },
      { en: 'cédula' },
      { en: 'DNIC' },
    ],
    subtopics: [
      { en: 'Temporary residency', ru: 'Временная резиденция', es: 'Residencia temporaria', de: 'Befristete Residenz' },
      { en: 'Permanent residency', ru: 'Постоянная резиденция', es: 'Residencia permanente', de: 'Dauerhafte Residenz' },
    ],
    glossary: [
      {
        en: { term: 'Cédula', definition: 'The national identity card issued to residents.' },
        ru: { term: 'Cédula', definition: 'Удостоверение личности, которое выдают резидентам.' },
        es: { term: 'Cédula de identidad', definition: 'El documento nacional de identidad que se entrega a los residentes.' },
        de: { term: 'Cédula', definition: 'Der nationale Personalausweis für Einwohner.' },
      },
      {
        en: { term: 'Legal residency', definition: 'Permission to live in the country, temporary or permanent.' },
        ru: { term: 'Легальная резиденция', definition: 'Разрешение жить в стране, временное или постоянное.' },
        es: { term: 'Residencia legal', definition: 'Permiso para vivir en el país, temporario o permanente.' },
        de: { term: 'Legale Residenz', definition: 'Aufenthaltsrecht im Land, befristet oder dauerhaft.' },
      },
    ],
    entities: [
      { type: 'government_agency', name: { en: 'DNIC (national ID office)', es: 'DNIC (Dirección Nacional de Identificación Civil)' } },
      { type: 'government_agency', name: { en: 'Migration office', ru: 'Миграционная служба', es: 'Dirección Nacional de Migración', de: 'Migrationsbehörde' } },
    ],
    resources: [
      {
        url: 'https://example.org/mock/migration-office',
        type: 'website',
        text: {
          en: { name: 'Migration office (sample link)', description: 'Placeholder for the official residency page.' },
          ru: { name: 'Миграционная служба (пример ссылки)', description: 'Заглушка вместо официальной страницы о резиденции.' },
          es: { name: 'Migración (enlace de ejemplo)', description: 'Marcador de posición de la página oficial de residencia.' },
        },
      },
    ],
  },
  {
    card_id: 'card.residency.checklist.documents_full',
    topic_id: 'topic.residency',
    card_type: 'how_to',
    content_category: 'checklist',
    ...PUBLIC_ACTIVE,
    confidence: 'medium_high',
    staleness_risk: 'medium',
    needs_review: false,
    sensitivity_tags: ['legal'],
    quality_score: 0.88,
    alignment_score: 0.81,
    search_boost: 0.2,
    last_updated: '2026-08-14T00:00:00Z',
    text: {
      en: tx(
        'Residency application: full document checklist',
        'Everything people usually gather before the residency appointment, grouped by stage. A long list — skim the headings first.',
        longChecklistEn,
      ),
      ru: tx(
        'Подача на резиденцию: полный список документов',
        'Всё, что обычно собирают к встрече в миграционной службе, по этапам. Список длинный — сначала пробегитесь по заголовкам.',
        longChecklistRu,
      ),
    },
    keywords: [{ en: 'apostille', ru: 'апостиль', es: 'apostilla', de: 'Apostille' }, { en: 'cédula' }],
    glossary: [
      {
        en: { term: 'Apostille', definition: 'A certificate that makes a public document valid abroad.' },
        ru: { term: 'Апостиль', definition: 'Штамп, который делает официальный документ действительным за границей.' },
      },
      {
        en: { term: 'Escribano', definition: 'A notary; many contracts and declarations are signed in front of one.' },
        ru: { term: 'Escribano', definition: 'Нотариус; многие договоры и декларации подписывают у него.' },
      },
    ],
    resources: [
      {
        url: null,
        type: 'office',
        text: {
          en: { name: 'Certified public translators', description: 'Ask at the counter for the current list — no link in this sample.' },
          ru: { name: 'Присяжные переводчики', description: 'Актуальный список спрашивайте в окне приёма — ссылки в этом примере нет.' },
        },
      },
      {
        url: 'https://example.org/mock/apostille',
        type: 'website',
        text: { en: { name: 'Apostille information (sample link)', description: null } },
      },
    ],
  },
  {
    card_id: 'card.residency.instruction.cedula_appointment',
    topic_id: 'topic.residency',
    card_type: 'how_to',
    content_category: 'instruction',
    ...PUBLIC_ACTIVE,
    confidence: 'high',
    staleness_risk: 'high',
    needs_review: true,
    sensitivity_tags: ['legal', 'time_sensitive'],
    quality_score: 0.9,
    alignment_score: 0.77,
    search_boost: 0.3,
    last_updated: '2026-10-02T00:00:00Z',
    text: {
      en: tx(
        'Booking a cédula appointment',
        'Book online at DNIC once your residency file is open; bring the filing receipt and your passport.',
        'Appointments for the cédula are booked online.\n• Have your residency filing receipt and passport ready.\n• Pick the office — smaller towns sometimes have earlier dates.\n• Fingerprints and photo are taken on site.\n• The card is usually ready within a few weeks.\nThe booking system changes from time to time; if the steps look different, follow the official site.',
      ),
      ru: tx(
        'Запись на cédula',
        'Запись онлайн в DNIC после открытия дела о резиденции; возьмите квитанцию о подаче и паспорт.',
        'Запись на cédula — через интернет.\n• Подготовьте квитанцию о подаче на резиденцию и паспорт.\n• Выберите офис — в небольших городах иногда есть даты раньше.\n• Отпечатки пальцев и фото делают на месте.\n• Карта обычно готова через несколько недель.\nСистема записи иногда меняется; если шаги выглядят иначе, следуйте официальному сайту.',
      ),
      es: tx(
        'Agendar la cédula',
        'Se agenda en línea en DNIC con el expediente de residencia iniciado; llevá el comprobante del trámite y el pasaporte.',
        'La hora para la cédula se agenda en línea.\n• Tené a mano el comprobante del trámite de residencia y el pasaporte.\n• Elegí la oficina: en el interior a veces hay fechas antes.\n• Las huellas y la foto se toman en el lugar.\n• La cédula suele estar pronta en pocas semanas.\nEl sistema de agenda cambia cada tanto; si los pasos se ven distintos, seguí el sitio oficial.',
      ),
      de: tx(
        'Termin für die Cédula buchen',
        'Online bei der DNIC buchen, sobald der Residenzantrag läuft; Antragsbestätigung und Reisepass mitbringen.',
        'Termine für die Cédula werden online gebucht.\n• Antragsbestätigung und Reisepass bereithalten.\n• Büro auswählen — in kleineren Orten gibt es manchmal frühere Termine.\n• Fingerabdrücke und Foto werden vor Ort gemacht.\n• Der Ausweis ist meist nach wenigen Wochen fertig.\nDas Buchungssystem ändert sich gelegentlich; im Zweifel der offiziellen Website folgen.',
      ),
    },
    keywords: [{ en: 'appointment', ru: 'запись', es: 'agenda', de: 'Termin' }, { en: 'DNIC' }],
    glossary: [
      {
        en: { term: 'Cédula', definition: 'The national identity card issued to residents.' },
        es: { term: 'Cédula de identidad', definition: 'El documento nacional de identidad que se entrega a los residentes.' },
      },
    ],
    entities: [{ type: 'government_agency', name: { en: 'DNIC (national ID office)' } }],
  },
  {
    card_id: 'card.residency.advice.40',
    topic_id: 'topic.residency',
    card_type: 'how_to',
    content_category: 'advice',
    ...PUBLIC_ACTIVE,
    confidence: 'medium',
    staleness_risk: 'medium',
    needs_review: false,
    sensitivity_tags: [],
    quality_score: 0.62,
    alignment_score: 0.44,
    search_boost: 0,
    last_updated: '2026-05-20T00:00:00Z',
    text: {
      en: tx(
        'Bring more copies than you think',
        'People repeatedly say: two copies of every document save a second trip.',
        'Several people mention that offices rarely make copies for you and that a missing copy means coming back another day. Two copies of every page, plus a digital scan on your phone, is the common advice. Evidence for this card is thin — it comes from a handful of messages.',
      ),
      ru: tx(
        'Берите больше копий, чем кажется нужным',
        'Многие повторяют: две копии каждого документа избавляют от второго визита.',
        'Несколько человек пишут, что в офисах редко делают копии за вас, и без копии приходится приходить ещё раз. Частый совет — по две копии каждой страницы и скан в телефоне. Подтверждений у этой карточки мало: она основана на нескольких сообщениях.',
      ),
      es: tx(
        'Llevá más copias de las que creés',
        'Se repite mucho: dos copias de cada documento evitan una segunda visita.',
        'Varias personas cuentan que en las oficinas casi nunca hacen copias y que si falta una hay que volver otro día. El consejo habitual: dos copias de cada hoja y un escaneo en el celular. La evidencia de esta tarjeta es escasa: sale de unos pocos mensajes.',
      ),
      de: tx(
        'Mehr Kopien mitnehmen als gedacht',
        'Oft gehört: zwei Kopien jedes Dokuments ersparen einen zweiten Termin.',
        'Mehrere Leute berichten, dass Ämter selten Kopien machen und eine fehlende Kopie einen zweiten Besuch bedeutet. Üblicher Rat: zwei Kopien jeder Seite plus ein Scan auf dem Handy. Die Belege für diese Karte sind dünn — sie stammt aus wenigen Nachrichten.',
      ),
    },
  },
  {
    card_id: 'card.residency.warning.expired_documents',
    topic_id: 'topic.residency',
    card_type: 'how_to',
    content_category: 'warning',
    status: 'needs_expert_review',
    visibility: 'public',
    confidence: 'low',
    staleness_risk: 'high',
    needs_review: true,
    sensitivity_tags: ['legal'],
    quality_score: 0.55,
    alignment_score: 0.6,
    search_boost: 0,
    last_updated: '2026-07-11T00:00:00Z',
    text: {
      en: tx(
        'Watch document expiry dates',
        'Criminal-record certificates and health cards expire; an expired one can send you back to the start.',
        'Some documents are only accepted if they are recent on the day of the appointment. If an apostilled certificate expires while you wait, you may need to request, apostille and translate it again. This card is waiting for expert review — confirm the current validity periods with the migration office.',
      ),
      ru: tx(
        'Следите за сроками действия документов',
        'Справка о несудимости и медсправка имеют срок действия; просроченная может вернуть вас к началу.',
        'Некоторые документы принимают, только если они свежие на дату встречи. Если апостилированная справка истечёт во время ожидания, её, возможно, придётся заказывать, апостилировать и переводить заново. Карточка ждёт экспертной проверки — уточняйте актуальные сроки в миграционной службе.',
      ),
      es: tx(
        'Ojo con el vencimiento de los documentos',
        'El certificado de antecedentes y el carné de salud vencen; uno vencido puede hacerte empezar de nuevo.',
        'Algunos documentos solo se aceptan si son recientes el día de la cita. Si un certificado apostillado vence mientras esperás, quizás tengas que pedirlo, apostillarlo y traducirlo otra vez. Esta tarjeta espera revisión experta: confirmá los plazos vigentes en Migración.',
      ),
      de: tx(
        'Ablaufdaten der Dokumente im Blick behalten',
        'Führungszeugnis und Gesundheitszeugnis laufen ab; ein abgelaufenes kann dich zurück auf Anfang setzen.',
        'Manche Dokumente werden nur akzeptiert, wenn sie am Termin noch aktuell sind. Läuft ein apostilliertes Zeugnis während der Wartezeit ab, muss man es eventuell neu beantragen, apostillieren und übersetzen lassen. Diese Karte wartet auf eine Expertenprüfung — aktuelle Fristen bei der Migrationsbehörde bestätigen.',
      ),
    },
  },
  {
    card_id: 'card.residency.reference.legal_basis',
    topic_id: 'topic.residency',
    card_type: 'how_to',
    content_category: 'reference',
    status: 'active',
    visibility: 'internal',
    confidence: 'medium',
    staleness_risk: 'low',
    needs_review: false,
    sensitivity_tags: ['legal'],
    quality_score: 0.7,
    alignment_score: 0.85,
    search_boost: 0,
    last_updated: '2025-12-01T00:00:00Z',
    text: {
      en: tx(
        'Legal basis of residency (internal notes)',
        'Internal reference: which kinds of rules govern residency and where editors look them up.',
        "Editors' notes on the legal framework: a general migration law, implementing decrees and periodic administrative resolutions. Card text should link to the official consolidated text instead of quoting article numbers, which change. Internal — not shown to readers by default.",
      ),
      ru: tx(
        'Правовая основа резиденции (внутренние заметки)',
        'Внутренняя справка: какие нормы регулируют резиденцию и где редакторы их сверяют.',
        'Заметки редакторов о правовой базе: общий закон о миграции, подзаконные декреты и периодические административные резолюции. В текстах карточек лучше ссылаться на официальный сводный текст, а не цитировать номера статей — они меняются. Внутренняя карточка — по умолчанию читателям не показывается.',
      ),
      es: tx(
        'Base legal de la residencia (notas internas)',
        'Referencia interna: qué normas regulan la residencia y dónde las consultan los editores.',
        'Notas de edición sobre el marco legal: una ley general de migración, decretos reglamentarios y resoluciones administrativas periódicas. Las tarjetas deberían enlazar al texto oficial actualizado en lugar de citar números de artículo, que cambian. Interna: no se muestra a los lectores por defecto.',
      ),
      de: tx(
        'Rechtsgrundlage der Residenz (interne Notizen)',
        'Interne Referenz: welche Regeln die Residenz bestimmen und wo die Redaktion nachschlägt.',
        'Redaktionsnotizen zum Rechtsrahmen: ein allgemeines Migrationsgesetz, Durchführungsdekrete und regelmäßige Verwaltungsbeschlüsse. Karten sollten auf den offiziellen konsolidierten Text verlinken statt Artikelnummern zu zitieren, die sich ändern. Intern — Lesern standardmäßig nicht angezeigt.',
      ),
    },
    subtopics: [{ en: 'Legal framework', ru: 'Правовая база', es: 'Marco legal', de: 'Rechtsrahmen' }],
  },
  {
    card_id: 'card.residency.community.first_month',
    topic_id: 'topic.residency',
    card_type: 'how_to',
    content_category: 'community_experience',
    ...PUBLIC_ACTIVE,
    confidence: 'medium',
    staleness_risk: 'medium',
    needs_review: false,
    sensitivity_tags: [],
    quality_score: 0.66,
    alignment_score: 0.58,
    search_boost: 0,
    last_updated: '2026-06-03T00:00:00Z',
    text: {
      en: tx(
        'The first month: what people wish they had known',
        'Common first-month surprises: paperwork takes longer, cash still matters, and neighbourhood choice affects everything.',
        '• Paperwork takes longer than planned — book the first appointments right away.\n• Some small shops and markets still prefer cash.\n• The neighbourhood you pick shapes commute, noise and rent more than the apartment itself.\n• Winter indoors can feel cold: many homes have little insulation.\nCollected from community experience; individual situations differ.',
      ),
      ru: tx(
        'Первый месяц: что хотелось бы знать заранее',
        'Частые сюрпризы первого месяца: бумаги дольше, наличные всё ещё нужны, а район решает многое.',
        '• Бумажные дела занимают больше времени, чем планировалось, — записывайтесь на первые приёмы сразу.\n• Некоторые небольшие магазины и рынки по-прежнему предпочитают наличные.\n• Выбор района влияет на дорогу, шум и аренду сильнее, чем сама квартира.\n• Зимой в домах бывает холодно: утепление часто слабое.\nСобрано из опыта сообщества; у каждого ситуация своя.',
      ),
      es: tx(
        'El primer mes: lo que a la gente le hubiera gustado saber',
        'Sorpresas típicas del primer mes: los trámites demoran, el efectivo sigue sirviendo y el barrio lo cambia todo.',
        '• Los trámites llevan más de lo previsto: agendá las primeras citas enseguida.\n• Algunos comercios chicos y ferias prefieren efectivo.\n• El barrio define traslados, ruido y alquiler más que el propio apartamento.\n• En invierno las casas pueden ser frías: muchas tienen poca aislación.\nRecopilado de experiencias de la comunidad; cada caso es distinto.',
      ),
      de: tx(
        'Der erste Monat: was man gern vorher gewusst hätte',
        'Typische Überraschungen im ersten Monat: Behörden dauern, Bargeld zählt noch, und das Viertel prägt alles.',
        '• Behördengänge dauern länger als geplant — die ersten Termine sofort buchen.\n• Manche kleine Läden und Märkte bevorzugen noch Bargeld.\n• Das Viertel bestimmt Arbeitsweg, Lärm und Miete stärker als die Wohnung selbst.\n• Im Winter kann es drinnen kalt sein: viele Häuser sind kaum gedämmt.\nAus Erfahrungen der Community gesammelt; jede Situation ist anders.',
      ),
      pt: tx(
        'O primeiro mês: o que gostariam de ter sabido',
        'Surpresas comuns do primeiro mês: a burocracia demora, dinheiro vivo ainda conta e o bairro muda tudo.',
        '• A burocracia leva mais tempo do que o previsto — marque os primeiros atendimentos logo.\n• Algumas lojas pequenas e feiras ainda preferem dinheiro vivo.\n• O bairro define deslocamento, barulho e aluguel mais do que o próprio apartamento.\n• No inverno as casas podem ser frias: muitas têm pouco isolamento.\nReunido a partir de experiências da comunidade; cada caso é diferente.',
      ),
    },
  },

  // --- topic.banking ----------------------------------------------------------------------
  {
    card_id: 'card.banking.overview.main',
    topic_id: 'topic.banking',
    card_type: 'public_overview',
    content_category: 'overview',
    ...PUBLIC_ACTIVE,
    confidence: 'high',
    staleness_risk: 'low',
    needs_review: false,
    sensitivity_tags: ['financial'],
    quality_score: 0.9,
    alignment_score: 0.9,
    search_boost: 0.5,
    last_updated: '2026-09-12T00:00:00Z',
    text: {
      en: tx(
        'Banking: overview',
        'You can usually open a basic account once you have a cédula; before that, options are limited.',
        'Banks ask for identification, proof of address and proof of income. With a cédula the process is usually straightforward; without one, some banks accept a passport plus residency paperwork, others do not. Expect compliance questions about the origin of funds, especially for transfers from abroad.',
      ),
      ru: tx(
        'Банки: обзор',
        'Базовый счёт обычно можно открыть после получения cédula; до этого вариантов мало.',
        'Банки просят удостоверение личности, подтверждение адреса и доходов. С cédula процесс обычно простой; без неё одни банки принимают паспорт и бумаги о резиденции, другие — нет. Будьте готовы к вопросам комплаенса о происхождении средств, особенно при переводах из-за рубежа.',
      ),
      es: tx(
        'Bancos: panorama',
        'Con la cédula en mano normalmente se puede abrir una cuenta básica; antes, las opciones son pocas.',
        'Los bancos piden identificación, constancia de domicilio y de ingresos. Con cédula el trámite suele ser sencillo; sin ella, algunos bancos aceptan pasaporte más el trámite de residencia y otros no. Esperá preguntas sobre el origen de los fondos, sobre todo en transferencias desde el exterior.',
      ),
      de: tx(
        'Bank: Überblick',
        'Mit Cédula lässt sich meist ein Basiskonto eröffnen; davor gibt es nur wenige Optionen.',
        'Banken verlangen Ausweis, Adressnachweis und Einkommensnachweis. Mit Cédula ist das meist unkompliziert; ohne sie akzeptieren manche Banken Reisepass plus Residenzunterlagen, andere nicht. Mit Compliance-Fragen zur Herkunft der Mittel rechnen, besonders bei Überweisungen aus dem Ausland.',
      ),
    },
  },
  {
    card_id: 'card.banking.checklist.open_account',
    topic_id: 'topic.banking',
    card_type: 'how_to',
    content_category: 'checklist',
    ...PUBLIC_ACTIVE,
    confidence: 'medium_high',
    staleness_risk: 'medium',
    needs_review: false,
    sensitivity_tags: ['financial'],
    quality_score: 0.8,
    alignment_score: 0.74,
    search_boost: 0,
    last_updated: '2026-08-30T00:00:00Z',
    text: {
      en: tx(
        'Opening a bank account: checklist',
        'ID, proof of address, proof of income and patience.',
        '• Cédula (or passport + residency filing receipt, if the bank accepts it)\n• Proof of address: utility bill or rental contract\n• Proof of income: contract, payslips or a notarised income declaration\n• For funds from abroad: statements that show where the money comes from\n• Time: the review can take from a few days to a few weeks',
      ),
      ru: tx(
        'Открытие банковского счёта: чек-лист',
        'Удостоверение, подтверждение адреса, подтверждение дохода и терпение.',
        '• Cédula (или паспорт + квитанция о подаче на резиденцию, если банк это принимает)\n• Подтверждение адреса: счёт за коммунальные услуги или договор аренды\n• Подтверждение дохода: договор, расчётные листы или нотариальная декларация о доходах\n• Для средств из-за рубежа: выписки, показывающие их происхождение\n• Время: проверка занимает от нескольких дней до нескольких недель',
      ),
      es: tx(
        'Abrir una cuenta bancaria: lista',
        'Identificación, domicilio, ingresos y paciencia.',
        '• Cédula (o pasaporte + comprobante del trámite de residencia, si el banco lo acepta)\n• Constancia de domicilio: factura de servicios o contrato de alquiler\n• Constancia de ingresos: contrato, recibos de sueldo o declaración ante escribano\n• Para fondos del exterior: estados de cuenta que muestren el origen\n• Tiempo: la revisión puede llevar de unos días a algunas semanas',
      ),
      de: tx(
        'Bankkonto eröffnen: Checkliste',
        'Ausweis, Adressnachweis, Einkommensnachweis und Geduld.',
        '• Cédula (oder Reisepass + Antragsbestätigung der Residenz, falls die Bank das akzeptiert)\n• Adressnachweis: Nebenkostenrechnung oder Mietvertrag\n• Einkommensnachweis: Vertrag, Gehaltsabrechnungen oder notarielle Einkommenserklärung\n• Für Geld aus dem Ausland: Kontoauszüge, die die Herkunft zeigen\n• Zeit: die Prüfung dauert ein paar Tage bis einige Wochen',
      ),
    },
    keywords: [{ en: 'bank account', ru: 'банковский счёт', es: 'cuenta bancaria', de: 'Bankkonto' }],
    glossary: [
      {
        en: { term: 'Caja de ahorro', definition: 'A basic account, held in pesos or US dollars.' },
        ru: { term: 'Caja de ahorro', definition: 'Базовый счёт в песо или долларах США.' },
        es: { term: 'Caja de ahorro', definition: 'Cuenta básica, en pesos o en dólares.' },
        de: { term: 'Caja de ahorro', definition: 'Ein Basiskonto in Pesos oder US-Dollar.' },
      },
    ],
    entities: [
      { type: 'bank', name: { en: 'State-owned bank', ru: 'Государственный банк', es: 'Banco estatal', de: 'Staatsbank' } },
      { type: 'regulator', name: { en: 'Central bank', ru: 'Центральный банк', es: 'Banco Central', de: 'Zentralbank' } },
    ],
  },
  {
    card_id: 'card.banking.warning.transfer_limits',
    topic_id: 'topic.banking',
    card_type: 'how_to',
    content_category: 'warning',
    ...PUBLIC_ACTIVE,
    confidence: 'medium',
    staleness_risk: 'high',
    needs_review: true,
    sensitivity_tags: ['financial'],
    quality_score: 0.7,
    alignment_score: 0.66,
    search_boost: 0,
    last_updated: '2026-10-20T00:00:00Z',
    text: {
      en: tx(
        'Large transfers from abroad get questions',
        'Big incoming transfers can be held until you document the source of funds.',
        'Banks must check where large amounts come from. Have contracts, sale deeds or statements ready before you send money, not after it is held. Thresholds and procedures differ between banks and change over time.',
      ),
      ru: tx(
        'Крупные переводы из-за рубежа вызывают вопросы',
        'Большой входящий перевод могут задержать, пока вы не подтвердите происхождение средств.',
        'Банки обязаны проверять происхождение крупных сумм. Подготовьте договоры, документы о продаже или выписки до отправки денег, а не после того, как перевод задержат. Пороги и процедуры у банков разные и со временем меняются.',
      ),
      es: tx(
        'Las transferencias grandes generan preguntas',
        'Una transferencia grande desde el exterior puede quedar retenida hasta justificar el origen.',
        'Los bancos deben controlar el origen de montos grandes. Tené listos contratos, escrituras o estados de cuenta antes de enviar el dinero, no cuando ya está retenido. Los umbrales y procedimientos varían entre bancos y cambian con el tiempo.',
      ),
      de: tx(
        'Große Überweisungen aus dem Ausland werden hinterfragt',
        'Große eingehende Überweisungen können zurückgehalten werden, bis die Herkunft belegt ist.',
        'Banken müssen die Herkunft großer Beträge prüfen. Verträge, Kaufurkunden oder Kontoauszüge vor dem Senden bereithalten, nicht erst wenn das Geld festhängt. Schwellen und Abläufe unterscheiden sich je nach Bank und ändern sich.',
      ),
    },
  },
  {
    card_id: 'card.banking.community.no_cedula_yet',
    topic_id: 'topic.banking',
    card_type: 'how_to',
    content_category: 'community_experience',
    status: 'needs_review',
    visibility: 'public',
    confidence: 'low',
    staleness_risk: 'medium',
    needs_review: true,
    sensitivity_tags: ['financial'],
    quality_score: 0.4,
    alignment_score: 0.35,
    search_boost: 0,
    last_updated: '2026-04-02T00:00:00Z',
    text: {
      en: tx(
        'Paying for things before you have a bank account',
        'Unverified tips from the community for the weeks before a local account.',
        'Some people used an international card for the first weeks, others used money-transfer services that pay out in cash. Fees vary widely. Unreviewed and weakly supported — treat as pointers only.',
      ),
      ru: tx(
        'Как платить, пока нет местного счёта',
        'Непроверенные советы сообщества на первые недели до открытия счёта.',
        'Кто-то первое время пользовался международной картой, кто-то — сервисами денежных переводов с выдачей наличных. Комиссии сильно различаются. Не проверено и слабо подтверждено — используйте только как подсказку.',
      ),
    },
  },

  // --- topic.renting ----------------------------------------------------------------------
  {
    card_id: 'card.renting.overview.main',
    topic_id: 'topic.renting',
    card_type: 'summary',
    content_category: 'overview',
    ...PUBLIC_ACTIVE,
    confidence: 'high',
    staleness_risk: 'low',
    needs_review: false,
    sensitivity_tags: [],
    quality_score: 0.93,
    alignment_score: 0.9,
    search_boost: 0.5,
    last_updated: '2026-09-01T00:00:00Z',
    text: {
      en: tx(
        'Renting: overview',
        'Long-term rentals usually require a rental guarantee; short-term rentals are pricier but simpler.',
        'For a standard long-term contract the landlord or agency will ask for a guarantee: an insurance-type guarantee, a deposit, or a guarantee from a public body. Short-term furnished rentals skip most of this but cost more per month. Many people start short-term and look for a long-term place once they know the neighbourhoods.',
      ),
      ru: tx(
        'Аренда: обзор',
        'Для долгосрочной аренды обычно нужна гарантия; краткосрочная дороже, но проще.',
        'Для стандартного долгосрочного договора собственник или агентство попросит гарантию: страховую, депозит или гарантию государственной организации. Краткосрочная аренда с мебелью обходится без большей части этого, но дороже в месяц. Многие сначала снимают на короткий срок и ищут долгосрочное жильё, когда разберутся в районах.',
      ),
      es: tx(
        'Alquiler: panorama',
        'Para alquilar a largo plazo suele pedirse garantía; el alquiler temporario es más caro pero más simple.',
        'Para un contrato común a largo plazo, el propietario o la inmobiliaria pedirá una garantía: un seguro de alquiler, un depósito o la garantía de un organismo público. Los alquileres temporarios amueblados se saltean casi todo eso, pero cuestan más por mes. Muchos empiezan por un temporario y buscan algo fijo cuando ya conocen los barrios.',
      ),
      de: tx(
        'Mieten: Überblick',
        'Für langfristige Mieten braucht man meist eine Mietgarantie; Kurzzeitmieten sind teurer, aber einfacher.',
        'Für einen normalen langfristigen Vertrag verlangen Vermieter oder Makler eine Garantie: eine Versicherungsgarantie, eine Kaution oder die Garantie einer öffentlichen Stelle. Möblierte Kurzzeitmieten sparen das meiste davon, kosten aber mehr pro Monat. Viele starten kurzfristig und suchen später etwas Dauerhaftes, wenn sie die Viertel kennen.',
      ),
      pt: tx(
        'Aluguel: visão geral',
        'Para aluguel de longo prazo normalmente se exige garantia; o temporário é mais caro, mas mais simples.',
        'Para um contrato comum de longo prazo, o proprietário ou a imobiliária pede uma garantia: um seguro-fiança, um depósito ou a garantia de um órgão público. Aluguéis temporários mobiliados dispensam quase tudo isso, mas custam mais por mês. Muita gente começa no temporário e procura algo fixo quando já conhece os bairros.',
      ),
    },
  },
  {
    card_id: 'card.renting.instruction.guarantee_options',
    topic_id: 'topic.renting',
    card_type: 'how_to',
    content_category: 'instruction',
    ...PUBLIC_ACTIVE,
    confidence: 'medium_high',
    staleness_risk: 'medium',
    needs_review: false,
    sensitivity_tags: ['financial'],
    quality_score: 0.86,
    alignment_score: 0.8,
    search_boost: 0.2,
    last_updated: '2026-07-25T00:00:00Z',
    text: {
      en: tx(
        'Rental guarantee options compared',
        'Insurance guarantee, cash deposit or a public-body guarantee — each with different paperwork.',
        '• Insurance guarantee: an insurer covers the landlord; you pay a fee and need proof of income.\n• Deposit: several months of rent held for the contract term; simple, but ties up cash.\n• Public-body guarantee: offered by some public institutions to employees or members; slower to arrange.\nNot every landlord accepts every option — ask before you fall in love with a flat.',
      ),
      ru: tx(
        'Варианты гарантии для аренды',
        'Страховая гарантия, денежный депозит или гарантия госорганизации — у каждой свои документы.',
        '• Страховая гарантия: страховщик покрывает собственника; вы платите взнос и подтверждаете доход.\n• Депозит: несколько месячных платежей на весь срок договора; просто, но замораживает деньги.\n• Гарантия госорганизации: доступна сотрудникам или членам некоторых организаций; оформляется дольше.\nНе все собственники принимают все варианты — спросите заранее.',
      ),
      es: tx(
        'Opciones de garantía de alquiler',
        'Seguro de alquiler, depósito o garantía de un organismo público: cada una con papeles distintos.',
        '• Seguro de alquiler: una aseguradora cubre al propietario; pagás una prima y demostrás ingresos.\n• Depósito: varios meses de alquiler retenidos durante el contrato; simple, pero inmoviliza dinero.\n• Garantía de organismo público: la ofrecen algunas instituciones a funcionarios o socios; demora más.\nNo todos los propietarios aceptan todas las opciones: preguntá antes de enamorarte de un apartamento.',
      ),
      de: tx(
        'Mietgarantien im Vergleich',
        'Versicherungsgarantie, Barkaution oder Garantie einer öffentlichen Stelle — jeweils mit anderem Papierkram.',
        '• Versicherungsgarantie: ein Versicherer sichert den Vermieter ab; du zahlst eine Prämie und weist Einkommen nach.\n• Kaution: mehrere Monatsmieten für die Vertragsdauer hinterlegt; einfach, bindet aber Geld.\n• Garantie einer öffentlichen Stelle: für Angestellte oder Mitglieder mancher Institutionen; dauert länger.\nNicht jeder Vermieter akzeptiert jede Option — vorher fragen.',
      ),
      pt: tx(
        'Opções de garantia de aluguel',
        'Seguro-fiança, depósito em dinheiro ou garantia de órgão público — cada uma com papéis diferentes.',
        '• Seguro-fiança: uma seguradora cobre o proprietário; você paga um prêmio e comprova renda.\n• Depósito: alguns meses de aluguel retidos durante o contrato; simples, mas imobiliza dinheiro.\n• Garantia de órgão público: oferecida por algumas instituições a funcionários ou associados; demora mais.\nNem todo proprietário aceita todas as opções — pergunte antes.',
      ),
    },
    keywords: [
      { en: 'guarantee', ru: 'гарантия', es: 'garantía', de: 'Garantie', pt: 'garantia' },
      { en: 'deposit', ru: 'депозит', es: 'depósito', de: 'Kaution', pt: 'depósito' },
    ],
    glossary: [
      {
        en: { term: 'Rental guarantee (garantía)', definition: 'Security the landlord requires for a long-term contract.' },
        ru: { term: 'Гарантия (garantía)', definition: 'Обеспечение, которое собственник требует для долгосрочного договора.' },
        es: { term: 'Garantía de alquiler', definition: 'Respaldo que pide el propietario para un contrato a largo plazo.' },
        de: { term: 'Mietgarantie (garantía)', definition: 'Sicherheit, die der Vermieter für einen langfristigen Vertrag verlangt.' },
        pt: { term: 'Garantia de aluguel', definition: 'Respaldo que o proprietário exige para um contrato de longo prazo.' },
      },
      {
        en: { term: 'Depósito', definition: 'A cash deposit held for the duration of the contract.' },
        es: { term: 'Depósito', definition: 'Dinero en garantía retenido mientras dura el contrato.' },
      },
    ],
    entities: [
      { type: 'insurer', name: { en: 'Rental guarantee insurers', ru: 'Страховщики арендных гарантий', es: 'Aseguradoras de alquiler', de: 'Mietgarantie-Versicherer' } },
      { type: 'government_agency', name: { en: 'Public guarantee office', ru: 'Государственная служба гарантий', es: 'Oficina pública de garantías', de: 'Öffentliche Garantiestelle' } },
    ],
    resources: [
      {
        url: 'https://example.org/mock/rental-guarantees',
        type: 'website',
        text: {
          en: { name: 'Rental guarantee comparison (sample link)', description: 'Placeholder for an official comparison page.' },
          pt: { name: 'Comparação de garantias (link de exemplo)', description: 'Marcador de posição para uma página oficial.' },
        },
      },
    ],
  },
  {
    card_id: 'card.renting.advice.12',
    topic_id: 'topic.renting',
    card_type: 'how_to',
    content_category: 'advice',
    ...PUBLIC_ACTIVE,
    confidence: 'medium',
    staleness_risk: 'low',
    needs_review: false,
    sensitivity_tags: [],
    quality_score: 0.6,
    alignment_score: 0.7,
    search_boost: 0,
    last_updated: '2026-03-15T00:00:00Z',
    text: {
      en: tx('Visit at different times of day', 'Before signing, visit the flat in the evening and on a weekend.'),
      ru: tx('Посмотрите квартиру в разное время', 'Перед подписанием зайдите вечером и в выходной.'),
      es: tx('Visitá en distintos horarios', 'Antes de firmar, visitá el apartamento de noche y un fin de semana.'),
      de: tx('Zu verschiedenen Tageszeiten besichtigen', 'Vor der Unterschrift abends und am Wochenende vorbeischauen.'),
      pt: tx('Visite em horários diferentes', 'Antes de assinar, visite o apartamento à noite e num fim de semana.'),
    },
  },
  {
    card_id: 'card.renting.warning.deposit_scams',
    topic_id: 'topic.renting',
    card_type: 'how_to',
    content_category: 'warning',
    ...PUBLIC_ACTIVE,
    confidence: 'medium',
    staleness_risk: 'medium',
    needs_review: false,
    sensitivity_tags: ['financial'],
    quality_score: 0.75,
    alignment_score: 0.69,
    search_boost: 0,
    last_updated: '2026-08-08T00:00:00Z',
    text: {
      en: tx(
        'Never pay a deposit before seeing the flat',
        "A common scam: a cheap listing, an owner who is 'abroad', and a request to transfer a deposit first.",
        'If the owner cannot show the flat, asks for a transfer to hold it, or pressures you to decide today, walk away. Sign through an agency or with a notary (escribano) and pay only against a signed contract.',
      ),
      ru: tx(
        'Не платите депозит, не увидев квартиру',
        'Частая схема: дешёвое объявление, хозяин «за границей» и просьба сначала перевести депозит.',
        'Если хозяин не может показать квартиру, просит перевод «чтобы придержать» или торопит решить сегодня — уходите. Подписывайте через агентство или у нотариуса (escribano) и платите только по подписанному договору.',
      ),
      es: tx(
        'Nunca pagues una seña sin ver el apartamento',
        'Estafa común: aviso barato, dueño que está «en el exterior» y pedido de transferir una seña antes.',
        'Si el dueño no puede mostrar el apartamento, pide una transferencia para reservarlo o te apura a decidir hoy, desconfiá. Firmá con inmobiliaria o ante escribano y pagá solo contra contrato firmado.',
      ),
      de: tx(
        'Nie eine Anzahlung ohne Besichtigung',
        'Häufige Masche: günstiges Inserat, Eigentümer „im Ausland“ und die Bitte, vorab eine Anzahlung zu überweisen.',
        'Wenn der Eigentümer die Wohnung nicht zeigen kann, eine Überweisung zum Reservieren verlangt oder zur Eile drängt: Finger weg. Über einen Makler oder beim Notar (escribano) unterschreiben und nur gegen unterschriebenen Vertrag zahlen.',
      ),
    },
  },
  {
    card_id: 'card.renting.resource_list.listings',
    topic_id: 'topic.renting',
    card_type: 'how_to',
    content_category: 'resource_list',
    ...PUBLIC_ACTIVE,
    confidence: null,
    staleness_risk: null,
    needs_review: false,
    sensitivity_tags: null,
    quality_score: 0.5,
    alignment_score: null,
    search_boost: 0,
    last_updated: '2026-02-10T00:00:00Z',
    text: {
      en: tx(
        'Where to look for listings',
        'Listing portals, agencies and community boards — see the resources below.',
        'Most long-term listings are on large property portals and agency websites; community boards are useful for short-term rooms. The links below are placeholders in this sample data set.',
      ),
      ru: tx(
        'Где искать объявления',
        'Порталы недвижимости, агентства и доски сообщества — см. ресурсы ниже.',
        'Большинство долгосрочных объявлений — на крупных порталах недвижимости и сайтах агентств; доски сообщества полезны для краткосрочных комнат. Ссылки ниже — заглушки в этом тестовом наборе данных.',
      ),
      es: tx(
        'Dónde buscar avisos',
        'Portales, inmobiliarias y carteleras de la comunidad: ver los recursos abajo.',
        'La mayoría de los avisos a largo plazo están en grandes portales inmobiliarios y sitios de inmobiliarias; las carteleras de la comunidad sirven para cuartos temporarios. Los enlaces de abajo son marcadores de posición en este conjunto de datos de prueba.',
      ),
      de: tx(
        'Wo man Angebote findet',
        'Immobilienportale, Makler und Community-Boards — siehe Ressourcen unten.',
        'Die meisten langfristigen Angebote stehen auf großen Immobilienportalen und Maklerseiten; Community-Boards helfen bei Zimmern auf Zeit. Die Links unten sind Platzhalter in diesem Testdatensatz.',
      ),
    },
    resources: [
      {
        url: 'https://example.org/mock/property-portal',
        type: 'website',
        text: {
          en: { name: 'Property portal (sample link)', description: 'Long-term and short-term listings.' },
          ru: { name: 'Портал недвижимости (пример ссылки)', description: 'Долгосрочные и краткосрочные объявления.' },
          es: { name: 'Portal inmobiliario (enlace de ejemplo)', description: 'Avisos de largo y corto plazo.' },
          de: { name: 'Immobilienportal (Beispiellink)', description: 'Lang- und Kurzzeitangebote.' },
        },
      },
      {
        url: 'https://example.org/mock/agency-directory',
        type: 'directory',
        text: { en: { name: 'Agency directory (sample link)', description: null } },
      },
      {
        url: null,
        type: 'community',
        text: {
          en: { name: 'Neighbourhood notice boards', description: 'Paper boards in supermarkets and cafés; no link.' },
          ru: { name: 'Районные доски объявлений', description: 'Бумажные доски в супермаркетах и кафе; ссылки нет.' },
        },
      },
    ],
  },

  // --- topic.healthcare -------------------------------------------------------------------
  {
    card_id: 'card.healthcare.overview.main',
    topic_id: 'topic.healthcare',
    card_type: 'summary',
    content_category: 'overview',
    ...PUBLIC_ACTIVE,
    confidence: 'high',
    staleness_risk: 'low',
    needs_review: false,
    sensitivity_tags: ['health'],
    quality_score: 0.9,
    alignment_score: 0.88,
    search_boost: 0.5,
    last_updated: '2026-09-18T00:00:00Z',
    text: {
      en: tx(
        'Healthcare: overview',
        'Two systems: private cooperatives (mutualistas) with a monthly fee, and the public provider.',
        'Most residents belong either to a private health cooperative, paid monthly or through payroll contributions, or to the public provider. Formal employees are usually covered through the national health fund and can choose a provider. Emergency services and private add-ons are separate.',
      ),
      ru: tx(
        'Медицина: обзор',
        'Две системы: частные кооперативы (mutualistas) с ежемесячной оплатой и государственный провайдер.',
        'Большинство жителей прикреплены либо к частному медицинскому кооперативу (ежемесячный взнос или отчисления с зарплаты), либо к государственному провайдеру. Официально трудоустроенные обычно покрыты через национальный фонд здоровья и могут выбрать провайдера. Скорая помощь и частные дополнения оплачиваются отдельно.',
      ),
      es: tx(
        'Salud: panorama',
        'Dos sistemas: mutualistas privadas con cuota mensual y el prestador público.',
        'La mayoría de los residentes está afiliada a una mutualista, pagada por cuota o por aportes del sueldo, o al prestador público. Quienes trabajan en blanco suelen estar cubiertos por el fondo nacional de salud y pueden elegir prestador. Las emergencias móviles y los servicios extra van aparte.',
      ),
      de: tx(
        'Gesundheit: Überblick',
        'Zwei Systeme: private Genossenschaften (Mutualistas) mit Monatsbeitrag und der öffentliche Anbieter.',
        'Die meisten Einwohner sind entweder Mitglied einer privaten Gesundheitsgenossenschaft (Monatsbeitrag oder Lohnabzug) oder beim öffentlichen Anbieter. Angestellte sind meist über den nationalen Gesundheitsfonds versichert und können den Anbieter wählen. Notdienste und private Zusatzleistungen kommen extra.',
      ),
    },
  },
  {
    card_id: 'card.healthcare.reference.mutualista_vs_public',
    topic_id: 'topic.healthcare',
    card_type: 'how_to',
    content_category: 'reference',
    ...PUBLIC_ACTIVE,
    confidence: 'medium_high',
    staleness_risk: 'medium',
    needs_review: false,
    sensitivity_tags: ['health'],
    quality_score: 0.82,
    alignment_score: 0.79,
    search_boost: 0,
    last_updated: '2026-06-28T00:00:00Z',
    text: {
      en: tx(
        'Mutualista or public provider?',
        'Private cooperatives cost more and usually mean shorter waits; the public provider is cheaper or free.',
        '• Mutualista: monthly fee plus co-payments for visits and medicines; shorter waits for specialists, more locations.\n• Public provider: low or no cost, longer waiting lists in some specialties.\n• If you are formally employed, contributions through the national health fund may cover a mutualista.\nCompare co-payment tables before choosing; they differ a lot.',
      ),
      ru: tx(
        'Mutualista или государственный провайдер?',
        'Частные кооперативы дороже, но обычно с меньшими очередями; государственный провайдер дешевле или бесплатен.',
        '• Mutualista: ежемесячный взнос плюс доплаты за приёмы и лекарства; меньше ждать специалистов, больше филиалов.\n• Государственный провайдер: низкая стоимость или бесплатно, у некоторых специалистов длинные очереди.\n• При официальной работе отчисления в национальный фонд здоровья могут покрывать mutualista.\nПеред выбором сравните таблицы доплат — они сильно различаются.',
      ),
      es: tx(
        '¿Mutualista o prestador público?',
        'Las mutualistas cuestan más y suelen tener menos espera; el prestador público es más barato o gratuito.',
        '• Mutualista: cuota mensual más órdenes y tickets; menos espera para especialistas, más sedes.\n• Prestador público: bajo costo o gratuito, listas de espera más largas en algunas especialidades.\n• Si trabajás en blanco, los aportes al fondo nacional de salud pueden cubrir una mutualista.\nCompará las tablas de órdenes y tickets antes de elegir: varían mucho.',
      ),
      de: tx(
        'Mutualista oder öffentlicher Anbieter?',
        'Private Genossenschaften kosten mehr, meist mit kürzeren Wartezeiten; der öffentliche Anbieter ist günstiger oder kostenlos.',
        '• Mutualista: Monatsbeitrag plus Zuzahlungen für Arzttermine und Medikamente; kürzere Wartezeiten, mehr Standorte.\n• Öffentlicher Anbieter: geringe oder keine Kosten, in manchen Fachrichtungen lange Wartelisten.\n• Bei regulärer Anstellung können Beiträge zum nationalen Gesundheitsfonds eine Mutualista abdecken.\nZuzahlungstabellen vor der Wahl vergleichen — sie unterscheiden sich stark.',
      ),
    },
    keywords: [{ en: 'mutualista' }, { en: 'health insurance', ru: 'медстраховка', es: 'cobertura médica', de: 'Krankenversicherung' }],
    glossary: [
      {
        en: { term: 'Mutualista', definition: 'A private, member-based health cooperative.' },
        ru: { term: 'Mutualista', definition: 'Частный медицинский кооператив с членством.' },
        es: { term: 'Mutualista', definition: 'Institución de asistencia médica colectiva, privada.' },
        de: { term: 'Mutualista', definition: 'Eine private, mitgliederbasierte Gesundheitsgenossenschaft.' },
      },
      {
        en: { term: 'National health fund', definition: 'Payroll-funded scheme that pays for a provider of your choice.' },
        es: { term: 'Fondo nacional de salud', definition: 'Sistema financiado con aportes que paga al prestador elegido.' },
      },
    ],
    entities: [
      { type: 'public_provider', name: { en: 'Public health provider', ru: 'Государственный провайдер', es: 'Prestador público', de: 'Öffentlicher Anbieter' } },
      { type: 'government_agency', name: { en: 'Ministry of health', ru: 'Министерство здравоохранения', es: 'Ministerio de Salud', de: 'Gesundheitsministerium' } },
      { type: 'government_agency', name: { en: 'Social security office', ru: 'Служба социального страхования', es: 'Organismo de seguridad social', de: 'Sozialversicherungsamt' } },
    ],
  },
  {
    card_id: 'card.healthcare.instruction.carne_de_salud',
    topic_id: 'topic.healthcare',
    card_type: 'how_to',
    content_category: 'instruction',
    ...PUBLIC_ACTIVE,
    confidence: 'medium',
    staleness_risk: 'high',
    needs_review: true,
    sensitivity_tags: ['health'],
    quality_score: 0.74,
    alignment_score: 0.71,
    search_boost: 0,
    last_updated: '2026-10-11T00:00:00Z',
    text: {
      en: tx(
        'Getting the carné de salud',
        'The health card is a basic check-up at an authorised clinic; it is needed for residency and many jobs.',
        'Book at an authorised clinic or your health provider. It usually includes a short exam and routine lab tests, and the card is valid for a limited time. Requirements were updated recently — this card needs review.',
      ),
      ru: tx(
        'Как получить carné de salud',
        'Медсправка — базовый осмотр в аккредитованной клинике; нужна для резиденции и многих работ.',
        'Запишитесь в аккредитованную клинику или к своему медицинскому провайдеру. Обычно это короткий осмотр и стандартные анализы; справка действует ограниченное время. Требования недавно обновлялись — карточка требует проверки.',
      ),
      es: tx(
        'Sacar el carné de salud',
        'Es un control básico en una clínica habilitada; se pide para la residencia y para muchos trabajos.',
        'Se agenda en una clínica habilitada o en tu prestador de salud. Suele incluir un examen breve y análisis de rutina, y tiene vencimiento. Los requisitos cambiaron hace poco: esta tarjeta necesita revisión.',
      ),
      de: tx(
        'Das Gesundheitszeugnis (carné de salud)',
        'Eine Basisuntersuchung bei einer zugelassenen Klinik; nötig für die Residenz und viele Jobs.',
        'Termin bei einer zugelassenen Klinik oder beim eigenen Anbieter buchen. Meist eine kurze Untersuchung und Routine-Laborwerte; das Zeugnis ist befristet gültig. Die Anforderungen wurden kürzlich geändert — diese Karte muss geprüft werden.',
      ),
    },
  },
  {
    card_id: 'card.healthcare.community.emergency_visit',
    topic_id: 'topic.healthcare',
    card_type: 'how_to',
    content_category: 'community_experience',
    status: 'needs_review',
    visibility: 'internal',
    confidence: 'low',
    staleness_risk: 'medium',
    needs_review: true,
    sensitivity_tags: ['health'],
    quality_score: 0.45,
    alignment_score: 0.52,
    search_boost: 0,
    last_updated: '2026-01-19T00:00:00Z',
    text: {
      en: tx(
        'An emergency visit, as one member described it',
        'Unreviewed community account of using a mobile emergency service.',
        'One member describes calling a mobile emergency service they had subscribed to, being seen at home within the hour and receiving a referral the next day. Single account, unreviewed — kept internal.',
      ),
      ru: tx(
        'Экстренный вызов: рассказ участника',
        'Непроверенный рассказ участника сообщества о вызове частной скорой помощи.',
        'Участник рассказывает, что вызвал частную скорую по подписке, его осмотрели дома в течение часа и на следующий день дали направление. Единичный рассказ, не проверен — оставлен внутренним.',
      ),
      es: tx(
        'Una emergencia, contada por un miembro',
        'Relato sin revisar de un miembro de la comunidad sobre una emergencia móvil.',
        'Un miembro cuenta que llamó a la emergencia móvil a la que estaba afiliado, lo atendieron en su casa en menos de una hora y al día siguiente le dieron un pase. Relato único, sin revisar: queda interno.',
      ),
      de: tx(
        'Ein Notfall, wie ein Mitglied ihn beschreibt',
        'Ungeprüfter Community-Bericht über einen mobilen Notdienst.',
        'Ein Mitglied berichtet, es habe seinen abonnierten mobilen Notdienst gerufen, sei innerhalb einer Stunde zu Hause behandelt worden und habe am nächsten Tag eine Überweisung bekommen. Einzelbericht, ungeprüft — bleibt intern.',
      ),
    },
  },

  // --- topic.transport --------------------------------------------------------------------
  {
    card_id: 'card.transport.overview.main',
    topic_id: 'topic.transport',
    card_type: 'public_overview',
    content_category: 'overview',
    ...PUBLIC_ACTIVE,
    confidence: 'high',
    staleness_risk: 'low',
    needs_review: false,
    sensitivity_tags: [],
    quality_score: 0.88,
    alignment_score: 0.86,
    search_boost: 0.5,
    last_updated: '2026-08-21T00:00:00Z',
    text: {
      en: tx(
        'Getting around: overview',
        'City buses cover most needs; a transport card makes fares cheaper.',
        'Buses are the backbone of city transport, with a rechargeable card for discounted fares. Intercity buses connect most towns from the main terminal. Driving is common outside the capital; foreign licences can be exchanged after a period of residence.',
      ),
      ru: tx(
        'Как передвигаться: обзор',
        'Городские автобусы покрывают почти всё; с транспортной картой дешевле.',
        'Автобусы — основа городского транспорта, проезд по пополняемой карте дешевле. Междугородние автобусы связывают большинство городов с главным терминалом. За пределами столицы многие ездят на машине; иностранные права можно обменять после некоторого времени проживания.',
      ),
      es: tx(
        'Moverse: panorama',
        'Los ómnibus urbanos cubren casi todo; con tarjeta de transporte el boleto sale más barato.',
        'El ómnibus es la base del transporte en la ciudad, con una tarjeta recargable que abarata el boleto. Los ómnibus interdepartamentales conectan casi todas las ciudades desde la terminal principal. Fuera de la capital es habitual manejar; la licencia extranjera se puede canjear tras un tiempo de residencia.',
      ),
      de: tx(
        'Unterwegs: Überblick',
        'Stadtbusse decken fast alles ab; mit Fahrkarte ist es günstiger.',
        'Busse sind das Rückgrat des Stadtverkehrs, mit einer aufladbaren Karte für günstigere Fahrten. Überlandbusse verbinden die meisten Orte mit dem Hauptterminal. Außerhalb der Hauptstadt fährt man viel Auto; ausländische Führerscheine lassen sich nach einer gewissen Aufenthaltsdauer umtauschen.',
      ),
    },
  },
  {
    card_id: 'card.transport.instruction.license_exchange',
    topic_id: 'topic.transport',
    card_type: 'how_to',
    content_category: 'instruction',
    ...PUBLIC_ACTIVE,
    confidence: 'medium',
    staleness_risk: 'high',
    needs_review: false,
    sensitivity_tags: [],
    quality_score: 0.7,
    alignment_score: 0.49,
    search_boost: 0,
    last_updated: '2026-05-05T00:00:00Z',
    text: {
      en: tx(
        'Exchanging a foreign driving licence',
        'Usually done at the local municipality after you have a cédula; some licences need a practical test.',
        'Bring the foreign licence, the cédula, a translation if needed and the medical certificate for drivers. Whether a test is required depends on the issuing country. Few sources back this card — confirm with the municipality.',
      ),
      ru: tx(
        'Обмен иностранных водительских прав',
        'Обычно в местной интендансии после получения cédula; для некоторых прав нужен практический экзамен.',
        'Возьмите иностранные права, cédula, перевод при необходимости и медсправку для водителей. Нужен ли экзамен, зависит от страны, выдавшей права. У карточки мало источников — уточняйте в интендансии.',
      ),
      es: tx(
        'Canje de licencia de conducir extranjera',
        'Se hace en la intendencia con la cédula; algunas licencias requieren prueba práctica.',
        'Llevá la licencia extranjera, la cédula, traducción si corresponde y el certificado médico para conductores. Si hace falta prueba depende del país emisor. Pocas fuentes respaldan esta tarjeta: confirmalo en la intendencia.',
      ),
      de: tx(
        'Ausländischen Führerschein umtauschen',
        'Meist bei der Gemeindeverwaltung, sobald man eine Cédula hat; manche Führerscheine erfordern eine Fahrprüfung.',
        'Ausländischen Führerschein, Cédula, ggf. Übersetzung und das ärztliche Attest für Fahrer mitbringen. Ob eine Prüfung nötig ist, hängt vom Ausstellerland ab. Wenige Quellen stützen diese Karte — bei der Gemeinde nachfragen.',
      ),
    },
    // "libreta" (colloquial for the licence) is only a keyword, never in the text:
    // a search for it can only match through keywords.
    keywords: [
      { en: 'driving licence', ru: 'водительские права', es: 'libreta', de: 'Führerschein' },
    ],
  },
  {
    card_id: 'card.transport.advice.transport_card',
    topic_id: 'topic.transport',
    card_type: 'how_to',
    content_category: 'advice',
    ...PUBLIC_ACTIVE,
    confidence: 'high',
    staleness_risk: 'low',
    needs_review: false,
    sensitivity_tags: null,
    quality_score: null,
    alignment_score: null,
    search_boost: 0,
    last_updated: null,
    text: {
      en: tx('Get a transport card early', 'A rechargeable transport card makes every bus ride cheaper than paying cash.'),
      ru: tx('Сразу оформите транспортную карту', 'С пополняемой транспортной картой каждая поездка на автобусе дешевле, чем за наличные.'),
      es: tx('Sacá la tarjeta de transporte cuanto antes', 'Con la tarjeta recargable cada viaje en ómnibus sale más barato que en efectivo.'),
      de: tx('Früh eine Fahrkarte besorgen', 'Mit einer aufladbaren Karte ist jede Busfahrt günstiger als bar.'),
    },
  },

  // --- topic.pets (no public+active cards: visible only with "internal" on) -------------
  {
    card_id: 'card.pets.overview.main',
    topic_id: 'topic.pets',
    card_type: 'summary',
    content_category: 'overview',
    status: 'needs_review',
    visibility: 'internal',
    confidence: 'medium',
    staleness_risk: 'unknown', // not a known value → Badges.tsx fallback style
    needs_review: true,
    sensitivity_tags: [],
    quality_score: 0.5,
    alignment_score: 0.6,
    search_boost: 0,
    last_updated: '2025-11-30T00:00:00Z',
    text: {
      en: tx(
        'Moving with pets: draft overview',
        'Draft: microchip, vaccinations and a vet certificate are the usual basics.',
        'Draft notes: most people mention a microchip, a valid rabies vaccination and an international health certificate issued shortly before travel. Airline rules add their own requirements. Not reviewed — internal draft.',
      ),
      ru: tx(
        'Переезд с животными: черновик',
        'Черновик: микрочип, прививки и ветеринарный сертификат — обычный минимум.',
        'Черновые заметки: чаще всего упоминают микрочип, действующую прививку от бешенства и международный ветеринарный сертификат, выданный незадолго до поездки. Авиакомпании добавляют свои требования. Не проверено — внутренний черновик.',
      ),
      es: tx(
        'Mudarse con mascotas: borrador',
        'Borrador: microchip, vacunas y certificado veterinario son lo básico.',
        'Notas en borrador: se menciona microchip, vacuna antirrábica vigente y un certificado sanitario internacional emitido poco antes del viaje. Las aerolíneas agregan sus propios requisitos. Sin revisar: borrador interno.',
      ),
      de: tx(
        'Umzug mit Haustieren: Entwurf',
        'Entwurf: Mikrochip, Impfungen und ein Tierarztzeugnis sind die üblichen Grundlagen.',
        'Entwurfsnotizen: genannt werden meist Mikrochip, gültige Tollwutimpfung und ein internationales Gesundheitszeugnis kurz vor der Reise. Fluggesellschaften haben eigene Regeln. Ungeprüft — interner Entwurf.',
      ),
    },
  },
  {
    card_id: 'card.pets.checklist.import_rules',
    topic_id: 'topic.pets',
    card_type: 'how_to',
    content_category: 'checklist',
    status: 'needs_expert_review',
    visibility: 'public',
    confidence: 'unrated', // not a known value → Badges.tsx fallback style
    staleness_risk: 'high',
    needs_review: true,
    sensitivity_tags: ['legal'],
    quality_score: 0.42,
    alignment_score: 0.38,
    search_boost: 0,
    last_updated: '2025-10-04T00:00:00Z',
    text: {
      en: tx(
        'Pet import rules (awaiting expert review)',
        'Import rules for animals are strict and change; this card has not been verified.',
        '• Microchip compatible with common readers\n• Rabies vaccination within the accepted window\n• Official health certificate endorsed by the country of departure\n• Possible inspection on arrival\nAwaiting expert review — confirm with the official animal-health service before travelling.',
      ),
      ru: tx(
        'Правила ввоза животных (ждёт экспертной проверки)',
        'Правила ввоза животных строгие и меняются; карточка не проверена.',
        '• Микрочип, совместимый с распространёнными сканерами\n• Прививка от бешенства в допустимый срок\n• Официальный ветеринарный сертификат, заверенный в стране вылета\n• Возможный осмотр по прибытии\nЖдёт экспертной проверки — уточняйте в официальной ветеринарной службе перед поездкой.',
      ),
    },
  },
];
