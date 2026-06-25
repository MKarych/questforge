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
          'Чтобы начать играть, зарегистрируйтесь на платформе, перейдите в раздел «Игры», выберите понравившуюся игру и нажмите «Начать». Некоторые игры доступны сразу, для других может потребоваться регистрация команды или оплата.',
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
        question: 'Что делать, если игра не запускается?',
        answer:
          'Проверьте подключение к интернету, обновите страницу и попробуйте снова. Если проблема сохраняется, убедитесь, что ваш браузер обновлён до последней версии. Также проверьте, не заблокированы ли всплывающие окна в настройках браузера.',
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
          'После получения статуса организатора перейдите в раздел «Мои игры» и нажмите «Создать игру». Заполните описание, настройте сценарий, укажите параметры игры и опубликуйте её. Подробная инструкция доступна в разделе помощи для организаторов.',
      },
      {
        question: 'Какие форматы игр поддерживаются?',
        answer:
          'Платформа поддерживает различные форматы: квесты по точкам (с перемещением по локациям), текстовые квесты, викторины, фото-квесты и смешанные форматы. Вы также можете комбинировать разные типы заданий в одной игре.',
      },
      {
        question: 'Как модерировать участников?',
        answer:
          'В панели управления игрой вы можете просматривать список участников, отслеживать их прогресс, отправлять уведомления и при необходимости исключать участников, нарушающих правила.',
      },
      {
        question: 'Можно ли провести игру в определённую дату?',
        answer:
          'Да, вы можете установить дату и время начала игры, а также ограничить период, в течение которого игра будет доступна для прохождения. Это удобно для проведения мероприятий с фиксированным расписанием.',
      },
      {
        question: 'Как получить статистику по игре?',
        answer:
          'В панели организатора доступна подробная статистика: количество участников, время прохождения, процент выполнения заданий, результаты команд и многое другое. Данные можно экспортировать в CSV или PDF.',
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
          'Редактор сценариев позволяет создавать интерактивные повествования с помощью визуального интерфейса. Вы можете добавлять локации, персонажей, задания, диалоги и ветвления сюжета. Редактор поддерживает drag-and-drop и предпросмотр.',
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