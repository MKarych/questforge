'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    id: 'players',
    title: 'Для игроков',
    items: [
      {
        question: 'Как начать играть?',
        answer:
          'Чтобы начать играть, зарегистрируйтесь на платформе, найдите игру в каталоге или перейдите по share-ссылке от организатора. Нажмите «Зарегистрироваться», выбрав команду, и после подтверждения вы попадёте в лобби — комнату ожидания перед стартом.',
      },
      {
        question: 'Что такое share-ссылка и как по ней попасть в игру?',
        answer:
          'Share-ссылка — это уникальная ссылка вида /play/XXXXXXXX, которую организатор отправляет участникам. Перейдя по ней, вы сразу попадаете на страницу регистрации команды. Если вы уже зарегистрированы, система автоматически перенаправит вас в лобби или на текущее задание.',
      },
      {
        question: 'Нужно ли платить за участие в играх?',
        answer:
          'На платформе есть как бесплатные, так и платные игры. Стоимость участия устанавливается организатором каждой конкретной игры. Бесплатные игры отмечены соответствующей меткой на странице игры.',
      },
      {
        question: 'Можно ли играть одной командой?',
        answer:
          'Да, большинство игр поддерживают командный режим. Вы можете создать команду или присоединиться к существующей. Размер команды обычно указывается в описании игры.',
      },
      {
        question: 'Что такое лобби и зачем там кнопка «Готов»?',
        answer:
          'Лобби — это комната ожидания перед стартом игры. Вы видите список всех зарегистрированных команд и таймер до начала. Кнопка «Готов» подтверждает организатору, что ваша команда готова к игре. Когда все готовы и наступает время старта, игра запускается автоматически.',
      },
      {
        question: 'Я закрыл вкладку с игрой. Как вернуться?',
        answer:
          'Просто перейдите по той же share-ссылке. Система автоматически определит, что вы уже зарегистрированы, и перенаправит вас: в лобби (если игра ещё не началась), на текущее задание (если игра идёт) или на страницу результатов (если игра завершена).',
      },
      {
        question: 'Можно ли зайти в игру с другого устройства?',
        answer:
          'Да. Достаточно открыть share-ссылку на новом устройстве и войти в свой аккаунт. Система восстановит вашу сессию, и вы продолжите с того же места, где остановились.',
      },
      {
        question: 'Как отвечать на задания?',
        answer:
          'В зависимости от типа миссии: введите текст в поле ответа, выберите вариант, загрузите фото, отсканируйте QR-код или отметьте GPS-координаты. После отправки ответа вы получите feedback — правильно или нет.',
      },
      {
        question: 'Что такое подсказки и как они работают?',
        answer:
          'Если команда затрудняется с ответом, можно запросить подсказку. Каждая подсказка уменьшает итоговый счёт команды (штрафные очки). Используйте их с умом!',
      },
      {
        question: 'Как оставить отзыв об игре?',
        answer:
          'После прохождения игры вы можете оставить отзыв на странице игры. Ваш отзыв поможет другим игрокам выбрать интересную игру, а организаторам — улучшить свои проекты.',
      },
      {
        question: 'Можно ли играть с мобильного телефона?',
        answer:
          'Да, платформа адаптирована для мобильных устройств. Вы можете проходить игры через браузер на смартфоне или планшете. Для некоторых игр могут потребоваться GPS и камера.',
      },
    ],
  },
  {
    id: 'organizers',
    title: 'Для организаторов',
    items: [
      {
        question: 'Как стать организатором?',
        answer:
          'Для получения статуса организатора необходимо подать заявку в разделе «Стать организатором». После проверки вашей заявки администрацией вам будет открыт доступ к созданию и управлению играми.',
      },
      {
        question: 'Как создать свою игру?',
        answer:
          'Перейдите в раздел «Мои игры» → «Создать игру». Заполните название, описание, выберите сценарий, укажите город, дату и время старта. После создания игра находится в статусе DRAFT. Подробная инструкция доступна на странице /help/game-guide.',
      },
      {
        question: 'Какие статусы проходит игра?',
        answer:
          'DRAFT (черновик) → PUBLISHED (опубликована, видна в каталоге) → REGISTRATION_OPEN (регистрация открыта) → REGISTRATION_CLOSED (регистрация закрыта) → LOBBY (команды подтверждают готовность) → RUNNING (игра идёт) → FINISHED (завершена). На каждом этапе доступны свои действия.',
      },
      {
        question: 'Как запустить игру?',
        answer:
          'Убедитесь, что игра опубликована и регистрация открыта. Когда команды зарегистрировались, нажмите «Запустить игру» на странице управления. Система автоматически создаст игровые сессии для всех команд, и игроки увидят первое задание. Игру можно запустить и напрямую из PUBLISHED или REGISTRATION_OPEN.',
      },
      {
        question: 'Как игроки регистрируются на игру?',
        answer:
          'После открытия регистрации у игры появляется share-ссылка. Отправьте её игрокам. Они переходят по ссылке, выбирают команду и нажимают «Зарегистрироваться». После регистрации они попадают в лобби и видят кнопку «Готов».',
      },
      {
        question: 'Что такое лобби и как работает готовность команд?',
        answer:
          'Лобби — это этап перед стартом, где команды подтверждают готовность. Организатор видит, кто готов, а кто нет. Если все команды готовы и время старта наступило, игра запускается автоматически. Организатор также может запустить игру вручную.',
      },
      {
        question: 'Можно ли запустить игру раньше запланированного времени?',
        answer:
          'Да, если в настройках игры включена опция «Разрешить ранний старт» и все команды подтвердили готовность. Иначе игра запустится только после наступления указанного времени.',
      },
      {
        question: 'Что видит организатор во время игры?',
        answer:
          'На странице RUNNING доступен прогресс всех команд: текущее задание, счёт, штрафы, история ответов. Также виден таймер оставшегося времени и кнопка досрочного завершения игры.',
      },
      {
        question: 'Как завершить игру?',
        answer:
          'На странице RUNNING нажмите «Завершить игру». Все команды увидят страницу финиша с результатами. После завершения можно просмотреть итоговую статистику.',
      },
      {
        question: 'Как получить статистику по игре?',
        answer:
          'На странице управления игрой доступна информация: количество команд, их статус, счёт, штрафы. Во время игры на странице RUNNING отображается прогресс в реальном времени.',
      },
    ],
  },
  {
    id: 'authors',
    title: 'Для авторов сценариев',
    items: [
      {
        question: 'Кто может создавать сценарии?',
        answer:
          'Создавать сценарии могут все зарегистрированные пользователи. Для этого не требуется специальный статус — просто перейдите в раздел «Сценарии» и начните создавать свой первый сценарий с помощью встроенного редактора.',
      },
      {
        question: 'Как работает редактор сценариев?',
        answer:
          'Редактор сценариев работает на 6 примитивах Runtime: Scene (сцена), Action (действие игрока), State (состояние игры), Condition (условие), Event (событие), View (представление). Вы создаёте сцены, соединяете их переходами, добавляете миссии и условия. Подробная инструкция доступна на странице /help/editor-guide.',
      },
      {
        question: 'Какие типы сцен поддерживаются?',
        answer:
          'Старт, Финиш, Локация (GPS), Квиз (текстовые задания), Диалог (разговор с NPC), Слайд (медиа-контент), Цикл (повторение сцен), Кастом (голосования, аукционы). Каждая сцена может содержать миссии разных типов.',
      },
      {
        question: 'Какие типы миссий доступны?',
        answer:
          'Text (ввод текста), Code (ввод кода), Photo (загрузка фото), GPS (проверка координат), QR (сканирование кода), Choice (выбор варианта), Collect (сбор предмета), Dialogue (диалог с NPC), Audio (аудио-задание), Video (видео-задание), Inventory Get/Check (работа с инвентарём), Achievement (достижение).',
      },
      {
        question: 'Что такое Condition Builder?',
        answer:
          'Это древовидный конструктор условий с AND/OR группами. Позволяет создавать сложную логику: проверка переменных (score > 100), проверка инвентаря (has item «ключ»), проверка роли (role = «мафия»), проверка времени (elapsed > 300), случайные условия (random < 0.5).',
      },
      {
        question: 'Что такое система триггеров и событий?',
        answer:
          'Реактивная система: сценарий сам отвечает на действия игроков. Поддерживается 18 типов событий (вход/выход из сцены, завершение миссии, правильный/неправильный ответ, таймер, получение предмета, крафт, достижение, назначение роли, изменение переменной) и 12 типов действий (set_variable, add_score, teleport, show_notification, start/stop_timer, play_sound, show_modal, assign_role, give/remove_item, craft/use/trade_item, emit_event, call_api).',
      },
      {
        question: 'Можно ли использовать изображения и видео?',
        answer:
          'Да, вы можете загружать изображения и видео для использования в сценариях. Поддерживаются форматы JPEG, PNG, GIF для изображений и MP4, WebM для видео. Есть ограничение на размер файла — не более 50 МБ.',
      },
      {
        question: 'Как опубликовать сценарий?',
        answer:
          'После завершения работы над сценарием нажмите «Опубликовать». Сценарий будет отправлен на модерацию. После проверки он станет доступен организаторам для создания игр на его основе.',
      },
      {
        question: 'Есть ли шаблоны для сценариев?',
        answer:
          'Да, в редакторе доступна библиотека шаблонов для различных жанров: детектив, приключение, хоррор, обучение и другие. Шаблоны помогут быстро начать и создать качественный сценарий.',
      },
      {
        question: 'Как работают циклы в сценариях?',
        answer:
          'Поддерживаются три типа циклов: For (N раз — например, 5 раундов квиза), While (пока условие истинно — например, пока alive_players > 1), ForEach (по массиву элементов). Есть защита от бесконечных циклов: maxIterations = 100.',
      },
      {
        question: 'Что такое параллельные сценарии?',
        answer:
          'Вы можете запускать несколько сценариев одновременно с синхронизацией. Каждый сценарий имеет свои переменные и состояние. Точки синхронизации: wait_all, wait_any, sequence. Поддерживаются общие глобальные переменные и меж-сценарные события (emit/listen).',
      },
    ],
  },
  {
    id: 'moderation',
    title: 'Модерация и безопасность',
    items: [
      {
        question: 'Как проверяются игры и сценарии?',
        answer:
          'Все игры и сценарии проходят модерацию перед публикацией. Модераторы проверяют контент на соответствие правилам платформы, отсутствие оскорбительных материалов, корректность работы и безопасность для участников.',
      },
      {
        question: 'Что делать, если я столкнулся с нарушением?',
        answer:
          'Если вы обнаружили контент, нарушающий правила платформы, воспользуйтесь кнопкой «Пожаловаться» на странице игры или сценария. Также вы можете написать в службу поддержки через форму обратной связи.',
      },
      {
        question: 'Как защищены мои личные данные?',
        answer:
          'Мы серьёзно относимся к безопасности личных данных. Вся информация передаётся по защищённому протоколу HTTPS, пароли хранятся в зашифрованном виде. Подробнее читайте в Политике конфиденциальности.',
      },
      {
        question: 'Как предотвращается читерство?',
        answer:
          'На платформе используются различные механизмы защиты: отслеживание подозрительной активности, проверка временных меток, ограничение скорости прохождения. При выявлении нарушений организатор может дисквалифицировать участника.',
      },
    ],
  },
  {
    id: 'payment',
    title: 'Оплата и монетизация',
    items: [
      {
        question: 'Какие способы оплаты доступны?',
        answer:
          'Мы принимаем банковские карты (Visa, Mastercard, МИР), а также оплату через СБП (Система быстрых платежей). Для юридических лиц доступна оплата по счёту.',
      },
      {
        question: 'Как организатору получить оплату за игру?',
        answer:
          'Организаторы могут устанавливать плату за участие в игре. Средства поступают на внутренний счёт организатора и могут быть выведены на банковскую карту после вычета комиссии платформы.',
      },
      {
        question: 'Какая комиссия платформы?',
        answer:
          'Комиссия платформы составляет 10% от стоимости платных игр для организаторов с базовым тарифом. Для подписчиков PRO и Business комиссия снижается до 5% и 2% соответственно.',
      },
      {
        question: 'Как работает возврат средств?',
        answer:
          'Возврат средств возможен в течение 14 дней после покупки, если игра не была начата. Для возврата обратитесь в службу поддержки. В случае технических проблем с игрой возврат осуществляется в индивидуальном порядке.',
      },
      {
        question: 'Есть ли платные подписки?',
        answer:
          'Да, доступны подписки PRO и Business с расширенными возможностями: больше генераций AI в день, увеличенные лимиты на количество игр и команд, расширенная аналитика, доступ к маркетплейсу и экспорт данных.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Технические вопросы',
    items: [
      {
        question: 'Какие браузеры поддерживаются?',
        answer:
          'Платформа поддерживает последние версии Google Chrome, Mozilla Firefox, Safari и Microsoft Edge. Для наилучшего опыта рекомендуется использовать Google Chrome.',
      },
      {
        question: 'Почему не загружаются изображения?',
        answer:
          'Проверьте размер и формат файла. Максимальный размер — 50 МБ, поддерживаемые форматы: JPEG, PNG, GIF, WebP. Также убедитесь, что у вас стабильное интернет-соединение.',
      },
      {
        question: 'Как очистить кеш браузера?',
        answer:
          'В Chrome: нажмите Ctrl+Shift+Del, выберите «Изображения и другие файлы в кеше» и нажмите «Удалить данные». В других браузерах аналогичная функция доступна в настройках в разделе «История» или «Конфиденциальность».',
      },
      {
        question: 'Что делать, если страница не обновляется?',
        answer:
          'Попробуйте выполнить «жёсткое» обновление страницы: Ctrl+F5 (Windows) или Cmd+Shift+R (Mac). Если это не помогло, очистите кеш браузера и перезагрузите страницу.',
      },
      {
        question: 'Как связаться с технической поддержкой?',
        answer:
          'Вы можете написать нам на почту support@adventure-engine.com или воспользоваться формой обратной связи на странице поддержки. Мы стараемся отвечать в течение 24 часов в рабочие дни.',
      },
    ],
  },
];

function SearchIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-300 ${
        isOpen ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  searchQuery,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  searchQuery: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600/40 text-inherit rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-surface hover:bg-surface-elevated transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-text-primary flex-1 pr-2">
          {highlightText(item.question)}
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-5 pb-4 bg-surface">
          <p className="text-text-secondary leading-relaxed">{highlightText(item.answer)}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;

    const query = searchQuery.toLowerCase().trim();
    return FAQ_DATA
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const currentCategory = filteredCategories.find((c) => c.id === activeCategory) || filteredCategories[0];

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const totalQuestions = FAQ_DATA.reduce((sum, cat) => sum + cat.items.length, 0);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-surface-elevated rounded-lg w-1/3" />
              <div className="h-12 bg-surface-elevated rounded-lg" />
              <div className="h-64 bg-surface-elevated rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
            <a href="/" className="hover:text-primary transition-colors">
              Главная
            </a>
            <span>→</span>
            <span className="text-text-primary font-medium">FAQ</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-3">
              Часто задаваемые вопросы
            </h1>
            <p className="text-text-secondary text-lg">
              {totalQuestions} ответов на популярные вопросы о платформе
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Поиск по вопросам..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpenItems(new Set());
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-secondary transition-colors"
                aria-label="Очистить поиск"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search results info */}
          {searchQuery && (
            <div className="mb-6 text-sm text-text-secondary">
              Найдено:{' '}
              {filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0)}{' '}
              результатов
            </div>
          )}

          {/* Categories tabs */}
          {!searchQuery && (
            <div className="mb-8 overflow-x-auto -mx-4 px-4">
              <div className="flex gap-2 min-w-max pb-2">
                {FAQ_DATA.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      activeCategory === category.id
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-surface text-text-secondary hover:bg-surface-elevated hover:text-text-primary border border-border'
                    }`}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Items */}
          {currentCategory && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                {searchQuery ? 'Результаты поиска' : currentCategory.title}
              </h2>
              {currentCategory.items.map((item, index) => {
                const itemId = `${currentCategory.id}-${index}`;
                return (
                  <AccordionItem
                    key={itemId}
                    item={item}
                    isOpen={openItems.has(itemId)}
                    onToggle={() => toggleItem(itemId)}
                    searchQuery={searchQuery}
                  />
                );
              })}
            </div>
          )}

          {/* No results */}
          {currentCategory && currentCategory.items.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Ничего не найдено
              </h3>
              <p className="text-text-secondary">
                Попробуйте изменить поисковый запрос
              </p>
            </div>
          )}

          {/* Contact block */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Не нашли ответ?
            </h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Если вы не нашли ответ на свой вопрос, свяжитесь с нами — мы с радостью поможем!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@adventure-engine.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors duration-200 shadow-md shadow-primary/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@adventure-engine.com
              </a>
              <a
                href="/support"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface text-text-primary rounded-xl font-medium hover:bg-surface-elevated transition-colors duration-200 border border-border"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Форма обратной связи
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}