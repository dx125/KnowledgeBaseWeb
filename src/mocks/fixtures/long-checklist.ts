// SYNTHETIC FIXTURE DATA — for the offline mock backend only.
// The one deliberately long card body (≥ 5,000 characters) with "•" bullet text, used to
// exercise "Read more", wrapping and long-content layout. Written by hand; generic and
// possibly inaccurate — NOT relocation guidance. Only en + ru exist, so es/de/pt
// requests fall back to English for this card.

const section = (heading: string, bullets: string[]) =>
  [heading, ...bullets.map((b) => `• ${b}`)].join('\n');

export const longChecklistEn = [
  'A long, stage-by-stage list of what people usually gather for a residency application. ' +
    'Requirements change; treat this as a memory aid and confirm every item with the official source.',
  section('1. Before you start', [
    'Check the current requirements on the official migration website — this list may be out of date.',
    'Decide which residency route applies to you (temporary or permanent, regional agreement or general route).',
    'Make one folder, paper and digital, and keep a copy of everything you hand in.',
    'Expect several weeks between collecting documents and the first appointment, so plan expiry dates.',
  ]),
  section('2. Identity documents', [
    'Valid passport with several months of validity left. Bring the original and a copy of the photo page.',
    'Birth certificate from your country of origin, with an apostille or consular legalisation.',
    'If the certificate is not in Spanish: an official translation by a certified public translator registered locally.',
    'Marriage certificate when applying as a family, apostilled and translated the same way.',
    "Children's birth certificates that list both parents.",
  ]),
  section('3. Criminal record', [
    'A police clearance from every country you lived in during the last years; the exact period depends on the current rules.',
    'It usually has to be recent at the time of the appointment, so request it last.',
    'Apostille and translation again. Some people report translations made abroad were refused — check before paying.',
  ]),
  section('4. Proof of means', [
    'A document showing how you will support yourself: an employment contract, a pension statement, an employer letter or bank statements.',
    'Freelancers often bring invoices, client contracts and an income declaration certified by a notary (escribano).',
    'No amounts are given here on purpose; thresholds change, so ask at the counter or check the official site.',
  ]),
  section('5. Address in Uruguay', [
    'A rental contract, a utility bill in your name, or an address certificate from the local police station.',
    'If you stay with friends or in a short-term rental, ask in advance which proof of address is accepted.',
  ]),
  section('6. Health certificate', [
    'The health card (carné de salud) from an authorised clinic: a short check-up plus some routine lab tests.',
    'It expires, so get it reasonably close to the appointment date.',
    'Vaccination records; a few people were asked for a specific vaccine certificate.',
  ]),
  section('7. On the day of the appointment', [
    'Arrive early with originals and copies, sorted in the order of this list.',
    'Photos are normally taken on site, but carry two passport-style photos just in case.',
    'You may need a fee receipt; check in advance which payment networks are accepted.',
    'Write down the file number (número de expediente) — every follow-up asks for it.',
  ]),
  section('8. After filing', [
    'With the filing receipt you can usually book the cédula (identity card) at DNIC.',
    'While the application is in process the cédula is issued for a limited period and renewed later.',
    'Watch your email and the online tracker; missing a request for extra documents can stall the file for months.',
    'When residency is granted, check whether the cédula has to be re-issued with the new status.',
  ]),
  section('9. Mistakes people mention most', [
    'A document expiring while waiting for the appointment.',
    'A translation made by someone who is not a locally registered public translator.',
    'Names spelled differently across documents: accents, double surnames, transliteration from another alphabet.',
    'One document without an apostille.',
    'No copies — some offices will not make them for you.',
  ]),
  section('10. Family members', [
    'Each family member usually needs their own file, even when you apply together.',
    "School enrolment often asks for the child's cédula; ask the school which interim document it accepts.",
    "If a partner joins later, the first applicant's documents may be requested again for the new file.",
  ]),
  section('11. Fees and receipts', [
    'There are fees for the application, the cédula and some certificates; the amounts are updated periodically.',
    'Keep every payment receipt with the file — offices sometimes ask for the original.',
    'Transfers from abroad can take days to clear, so pay local fees locally where possible.',
  ]),
  section('12. Translations and apostilles, once more', [
    'Ask the translator to keep every name exactly as it appears in the passport.',
    'Some documents must be translated in full, including stamps and the apostille itself.',
    "Keep the translator's details on file in case a correction is needed later.",
  ]),
  section('13. If something goes wrong', [
    'A rejected document is not the end of the file: ask exactly what is missing, in writing if possible.',
    'Note the date, the office and what you were told at each visit; it helps when information conflicts.',
    'If the online tracker shows no progress for months, a polite in-person query is the usual next step.',
    'For complicated situations (earlier overstays, records abroad, unusual family cases), consider a specialist.',
  ]),
  section('14. Keeping records afterwards', [
    'Store scans of the final residency resolution and of the cédula in two separate places.',
    'Put renewal dates in a calendar with a reminder several weeks ahead.',
    'Keep the old file number; later procedures may refer to it.',
  ]),
  'Synthetic sample text for the mock backend. Always confirm with an official source or a specialist.',
].join('\n\n');

export const longChecklistRu = [
  'Длинный пошаговый список того, что обычно собирают для подачи на резиденцию. ' +
    'Требования меняются: используйте список как памятку и сверяйте каждый пункт с официальным источником.',
  section('1. Перед началом', [
    'Проверьте актуальные требования на официальном сайте миграционной службы — этот список может устареть.',
    'Определите, какой путь к резиденции вам подходит (временная или постоянная, по региональному соглашению или общий).',
    'Заведите одну папку, бумажную и электронную, и храните копии всего, что сдаёте.',
    'Между сбором документов и первой встречей обычно проходит несколько недель — учитывайте сроки действия бумаг.',
  ]),
  section('2. Документы личности', [
    'Действующий паспорт с запасом срока в несколько месяцев. Оригинал и копия страницы с фото.',
    'Свидетельство о рождении из страны происхождения с апостилем или консульской легализацией.',
    'Если документ не на испанском — официальный перевод у присяжного переводчика, зарегистрированного в Уругвае.',
    'Свидетельство о браке при подаче семьёй, с апостилем и переводом.',
    'Свидетельства о рождении детей, где указаны оба родителя.',
  ]),
  section('3. Справка о несудимости', [
    'Справка из каждой страны, где вы жили в последние годы; точный период зависит от текущих правил.',
    'Обычно она должна быть свежей на дату встречи, поэтому заказывайте её последней.',
    'Снова апостиль и перевод. Некоторым не приняли переводы, сделанные за границей, — уточните заранее.',
  ]),
  section('4. Подтверждение средств', [
    'Документ о том, на что вы будете жить: трудовой договор, пенсионная выписка, письмо работодателя или банковские выписки.',
    'Фрилансеры часто приносят счета, договоры с клиентами и декларацию о доходах, заверенную нотариусом (escribano).',
    'Суммы здесь намеренно не указаны: пороги меняются, уточняйте в окне приёма или на официальном сайте.',
  ]),
  section('5. Адрес в Уругвае', [
    'Договор аренды, счёт за коммунальные услуги на ваше имя или справка об адресе из местного полицейского участка.',
    'Если живёте у друзей или в краткосрочной аренде, заранее спросите, какое подтверждение адреса принимают.',
  ]),
  section('6. Медицинская справка', [
    'Carné de salud из аккредитованной клиники: короткий осмотр и несколько стандартных анализов.',
    'У неё есть срок действия, поэтому делайте её ближе к дате встречи.',
    'Сертификат о прививках; у некоторых спрашивали подтверждение конкретной прививки.',
  ]),
  section('7. В день встречи', [
    'Приходите заранее с оригиналами и копиями, разложенными в порядке этого списка.',
    'Фото обычно делают на месте, но возьмите пару фотографий паспортного формата на всякий случай.',
    'Может понадобиться квитанция об оплате сбора; заранее узнайте, через какие сети можно платить.',
    'Запишите номер дела (número de expediente) — его спрашивают при каждом обращении.',
  ]),
  section('8. После подачи', [
    'С квитанцией о подаче обычно можно записаться на cédula (удостоверение личности) в DNIC.',
    'Пока заявление рассматривается, cédula выдают на ограниченный срок и потом продлевают.',
    'Следите за почтой и онлайн-статусом: пропущенный запрос дополнительных документов может задержать дело на месяцы.',
    'Когда резиденцию одобрят, проверьте, нужно ли перевыпустить cédula с новым статусом.',
  ]),
  section('9. Частые ошибки', [
    'У одного из документов истёк срок, пока ждали встречу.',
    'Перевод сделан не местным присяжным переводчиком.',
    'Имя написано по-разному в разных документах: ударения, двойные фамилии, транслитерация с другого алфавита.',
    'На одном из документов нет апостиля.',
    'Нет копий — в некоторых офисах их за вас не сделают.',
  ]),
  section('10. Члены семьи', [
    'Обычно на каждого члена семьи открывают отдельное дело, даже если подаётесь вместе.',
    'Для записи ребёнка в школу часто просят его cédula; спросите в школе, какой временный документ подойдёт.',
    'Если партнёр присоединится позже, документы первого заявителя могут снова запросить для нового дела.',
  ]),
  section('11. Сборы и квитанции', [
    'Сборы есть за подачу, за cédula и за некоторые справки; суммы периодически пересматривают.',
    'Храните каждую квитанцию об оплате вместе с делом — иногда просят оригинал.',
    'Переводы из-за рубежа могут идти несколько дней, поэтому местные сборы по возможности платите на месте.',
  ]),
  section('12. Ещё раз о переводах и апостилях', [
    'Попросите переводчика писать все имена точно так же, как в паспорте.',
    'Некоторые документы нужно переводить целиком, включая печати и сам апостиль.',
    'Сохраните контакты переводчика на случай, если позже понадобится исправление.',
  ]),
  section('13. Если что-то пошло не так', [
    'Отклонённый документ — не конец дела: уточните, чего именно не хватает, по возможности письменно.',
    'Записывайте дату, офис и что вам сказали при каждом визите — это помогает, когда сведения расходятся.',
    'Если онлайн-статус месяцами не меняется, обычный следующий шаг — вежливо спросить лично.',
    'В сложных ситуациях (прежние нарушения сроков пребывания, справки из-за рубежа, необычные семейные случаи) стоит обратиться к специалисту.',
  ]),
  section('14. Что хранить потом', [
    'Храните сканы итогового решения о резиденции и cédula в двух разных местах.',
    'Внесите даты продления в календарь с напоминанием за несколько недель.',
    'Сохраните старый номер дела — на него могут ссылаться в будущих процедурах.',
  ]),
  'Синтетический пример текста для мок-бэкенда. Всегда сверяйтесь с официальным источником или специалистом.',
].join('\n\n');
