import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Инструкция по маркетплейсу | QuestForge',
  description: 'Полное руководство по маркетплейсу QuestForge: как покупать и продавать сценарии, типы лицензий, модерация, выплаты',
};

export default function MarketplaceGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/20 via-background to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-16 relative">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад в маркетплейс
          </Link>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            🛒 Инструкция по маркетплейсу
          </h1>
          <p className="text-lg text-text-secondary">
            Полное руководство: от покупки сценария до продажи собственных игр
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">

        {/* 1. Введение */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">1. Введение</h2>
          <div className="max-w-none">
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Маркетплейс QuestForge</strong> — это площадка, где 
              организаторы могут <strong className="text-text-primary">покупать</strong> готовые сценарии для своих игр, 
              а авторы — <strong className="text-text-primary">продавать</strong> свои сценарии и зарабатывать.
            </p>
            <p className="text-text-secondary leading-relaxed mt-2">
              Каждый сценарий в маркетплейсе проходит модерацию, имеет чёткую лицензию и цену. 
              После покупки вы получаете лицензию на использование сценария в своих играх.
            </p>
            <div className="bg-background-modifier-hover rounded-lg p-4 mt-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🎯 Схема работы</h3>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li>1️⃣ <strong className="text-text-primary">Автор</strong> создаёт сценарий в редакторе</li>
                <li>2️⃣ Выставляет его на продажу в маркетплейсе</li>
                <li>3️⃣ Сценарий проходит <strong className="text-text-primary">модерацию</strong></li>
                <li>4️⃣ После одобрения сценарий появляется в каталоге</li>
                <li>5️⃣ <strong className="text-text-primary">Покупатель</strong> находит сценарий, выбирает лицензию и покупает</li>
                <li>6️⃣ После покупки сценарий доступен в разделе «Мои лицензии»</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Покупателям */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">2. Покупателям</h2>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">🔍 Как найти сценарий</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border mb-4">
            <p className="text-sm text-text-secondary mb-2">
              На странице <Link href="/marketplace" className="text-primary hover:text-primary-hover">Маркетплейс</Link> доступны:
            </p>
            <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
              <li><strong className="text-text-primary">Поиск</strong> — по названию и описанию</li>
              <li><strong className="text-text-primary">Фильтр по категориям</strong> — квиз, городской квест, мафия и другие</li>
              <li><strong className="text-text-primary">Фильтр по цене</strong> — бесплатные, платные, любой диапазон</li>
              <li><strong className="text-text-primary">Сортировка</strong> — по новизне, цене, рейтингу, популярности</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">🛍 Как купить</h3>
          <div className="space-y-3 mb-4">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Шаг 1: Выберите сценарий</h4>
              <p className="text-xs text-text-secondary">Откройте карточку сценария, изучите описание, отзывы, рейтинг и тип лицензии.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Шаг 2: Добавьте в корзину</h4>
              <p className="text-xs text-text-secondary">Нажмите «В корзину» — сценарий добавится в корзину. Можно добавить несколько сценариев.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Шаг 3: Оформите заказ</h4>
              <p className="text-xs text-text-secondary">Перейдите в <Link href="/cart" className="text-primary hover:text-primary-hover">корзину</Link>, проверьте состав и нажмите «Оплатить».</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Шаг 4: Получите лицензию</h4>
              <p className="text-xs text-text-secondary">После оплаты сценарий появится в разделе <Link href="/marketplace/me/licenses" className="text-primary hover:text-primary-hover">Мои лицензии</Link>. Вы можете использовать его в своих играх согласно условиям лицензии.</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">📜 Типы лицензий</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { icon: '🎯', name: 'SINGLE', desc: 'Однократное использование. Вы можете провести одну игру по этому сценарию.', price: 'Базовая цена' },
              { icon: '🏙️', name: 'MULTI_CITY', desc: 'Много-городовая лицензия. Можно проводить игру в нескольких городах.', price: 'Средняя цена' },
              { icon: '💼', name: 'COMMERCIAL', desc: 'Коммерческое использование. Можно проводить платные игры для клиентов.', price: 'Высокая цена' },
              { icon: '🏷️', name: 'WHITE_LABEL', desc: 'White-label. Полное право на сценарий, можно продавать как свой.', price: 'Максимальная цена' },
            ].map(item => (
              <div key={item.name} className="flex items-start gap-3 bg-background-modifier-hover rounded-lg p-3 border border-border">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">{item.name}</h4>
                  <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
                  <p className="text-xs text-text-muted mt-1">{item.price}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">📋 Мои покупки и лицензии</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border mb-4">
            <p className="text-sm text-text-secondary mb-2">
              После покупки все ваши сценарии доступны в двух разделах:
            </p>
            <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
              <li>
                <Link href="/marketplace/me/purchases" className="text-primary hover:text-primary-hover">Мои покупки</Link> — 
                история всех покупок с деталями
              </li>
              <li>
                <Link href="/marketplace/me/licenses" className="text-primary hover:text-primary-hover">Мои лицензии</Link> — 
                активные лицензии, которые можно использовать в играх
              </li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">❓ Как задать вопрос продавцу</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border mb-4">
            <p className="text-sm text-text-secondary">
              На странице каждого сценария есть кнопка «Задать вопрос». 
              Вы можете спросить о деталях сценария, условиях лицензии или любых других аспектах. 
              Продавец получит уведомление и ответит вам.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">⭐ Отзывы</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
            <p className="text-sm text-text-secondary">
              После покупки вы можете оставить отзыв о сценарии — оценку от 1 до 5 звёзд и комментарий. 
              Отзывы помогают другим покупателям выбрать качественный сценарий. 
              Все отзывы проходят модерацию перед публикацией.
            </p>
          </div>
        </section>

        {/* 3. Продавцам */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">3. Продавцам</h2>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">📤 Как выставить сценарий на продажу</h3>
          <div className="space-y-3 mb-4">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Шаг 1: Создайте сценарий</h4>
              <p className="text-xs text-text-secondary">Создайте сценарий в <Link href="/organizer/scenarios" className="text-primary hover:text-primary-hover">редакторе сценариев</Link>. Убедитесь, что он полностью готов к использованию.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Шаг 2: Нажмите «Выставить на продажу»</h4>
              <p className="text-xs text-text-secondary">На странице сценария нажмите кнопку «Выставить на продажу». Откроется форма создания листинга.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Шаг 3: Заполните информацию</h4>
              <p className="text-xs text-text-secondary">Укажите название, описание, цену, тип лицензии, категорию, теги и загрузите изображение.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Шаг 4: Отправьте на модерацию</h4>
              <p className="text-xs text-text-secondary">После заполнения формы нажмите «Отправить на модерацию». Администратор проверит сценарий и либо одобрит, либо отклонит с комментарием.</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">⚙️ Настройки листинга</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border mb-4">
            <p className="text-sm text-text-secondary mb-2">При создании листинга вы можете настроить:</p>
            <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
              <li><strong className="text-text-primary">Название и описание</strong> — что будет видеть покупатель</li>
              <li><strong className="text-text-primary">Цена</strong> — стоимость сценария (можно указать 0 для бесплатного)</li>
              <li><strong className="text-text-primary">Тип лицензии</strong> — SINGLE, MULTI_CITY, COMMERCIAL или WHITE_LABEL</li>
              <li><strong className="text-text-primary">Категория</strong> — квиз, городской квест, мафия и т.д.</li>
              <li><strong className="text-text-primary">Теги</strong> — для улучшения поиска</li>
              <li><strong className="text-text-primary">Изображение</strong> — обложка сценария</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">🛡 Модерация</h3>
          <div className="space-y-3 mb-4">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Что проверяется</h4>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li>Корректность и полнота описания</li>
                <li>Работоспособность сценария (базовая валидация)</li>
                <li>Отсутствие запрещённого контента</li>
                <li>Соответствие цены и типа лицензии</li>
              </ul>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Статусы модерации</h4>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li><strong className="text-yellow-500">PENDING</strong> — ожидает проверки</li>
                <li><strong className="text-green-500">APPROVED</strong> — одобрен, сценарий опубликован</li>
                <li><strong className="text-red-500">REJECTED</strong> — отклонён с комментарием модератора</li>
              </ul>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Сроки</h4>
              <p className="text-xs text-text-secondary">Обычно модерация занимает до 24 часов. Вы получите уведомление о результате.</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">📊 Кабинет продавца</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border mb-4">
            <p className="text-sm text-text-secondary mb-2">
              В <Link href="/organizer/seller" className="text-primary hover:text-primary-hover">кабинете продавца</Link> доступны:
            </p>
            <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
              <li><strong className="text-text-primary">Дашборд</strong> — общая статистика: продажи, просмотры, доход</li>
              <li><strong className="text-text-primary">Мои листинги</strong> — управление опубликованными сценариями</li>
              <li><strong className="text-text-primary">Аналитика</strong> — детальная статистика по каждому сценарию</li>
              <li><strong className="text-text-primary">Вопросы</strong> — ответы на вопросы покупателей</li>
              <li><strong className="text-text-primary">Выплаты</strong> — баланс и запрос выплат</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">📈 Аналитика</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border mb-4">
            <p className="text-sm text-text-secondary">
              На странице <Link href="/organizer/seller/analytics" className="text-primary hover:text-primary-hover">Аналитика</Link> вы можете отслеживать:
              количество просмотров ваших листингов, количество покупок, общий доход, 
              динамику продаж по дням/неделям/месяцам. Это помогает понять, какие сценарии 
              пользуются спросом и скорректировать стратегию.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">💬 Вопросы покупателей</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border mb-4">
            <p className="text-sm text-text-secondary">
              На странице <Link href="/organizer/seller/questions" className="text-primary hover:text-primary-hover">Вопросы</Link> 
              вы видите все вопросы от покупателей. Отвечайте оперативно — это повышает доверие 
              и вероятность покупки. На каждый вопрос можно ответить только один раз.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">💰 Выплаты</h3>
          <div className="space-y-3 mb-4">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Баланс</h4>
              <p className="text-xs text-text-secondary">
                Все заработанные средства поступают на ваш баланс. 
                Текущий баланс отображается в <Link href="/organizer/seller" className="text-primary hover:text-primary-hover">кабинете продавца</Link>.
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Запрос выплаты</h4>
              <p className="text-xs text-text-secondary">
                На странице <Link href="/organizer/seller/payouts" className="text-primary hover:text-primary-hover">Выплаты</Link> 
                вы можете запросить выплату любой суммы с баланса. Выплаты обрабатываются администратором.
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">Комиссия платформы</h4>
              <p className="text-xs text-text-secondary">
                QuestForge удерживает комиссию 10% с каждой продажи. 
                Например, при продаже сценария за 1000₽ вы получите 900₽ на баланс.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Типы лицензий (детально) */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">4. Типы лицензий — детально</h2>
          <p className="text-text-secondary mb-4">
            Каждый сценарий в маркетплейсе продаётся с определённым типом лицензии. 
            Лицензия определяет, как вы можете использовать купленный сценарий.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Тип</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Описание</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Кому подходит</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Цена</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { type: 'SINGLE', icon: '🎯', desc: 'Однократное использование. Одна игра — одна лицензия.', who: 'Организаторам разовых игр', price: 'Базовая' },
                  { type: 'MULTI_CITY', icon: '🏙️', desc: 'Много-городовая. Можно проводить игру в нескольких городах одновременно или последовательно.', who: 'Сетевым организаторам', price: 'Средняя' },
                  { type: 'COMMERCIAL', icon: '💼', desc: 'Коммерческая. Можно проводить платные игры для клиентов, корпоративов и мероприятий.', who: 'Бизнес-организаторам', price: 'Высокая' },
                  { type: 'WHITE_LABEL', icon: '🏷️', desc: 'White-label. Полное право на сценарий. Можно продавать как свой, модифицировать и распространять.', who: 'Агентствам и крупным организаторам', price: 'Максимальная' },
                ].map((item, i) => (
                  <tr key={item.type} className={`border-b border-border ${i % 2 === 0 ? 'bg-background-modifier-hover' : ''}`}>
                    <td className="py-3 px-4 text-text-primary font-medium">{item.icon} {item.type}</td>
                    <td className="py-3 px-4 text-text-secondary">{item.desc}</td>
                    <td className="py-3 px-4 text-text-secondary">{item.who}</td>
                    <td className="py-3 px-4 text-text-secondary">{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">5. Часто задаваемые вопросы</h2>
          <div className="space-y-3">
            {[
              {
                q: 'Можно ли вернуть деньги за сценарий?',
                a: 'Возврат возможен в течение 14 дней после покупки, если сценарий не был использован в игре. Для возврата обратитесь в поддержку.',
              },
              {
                q: 'Что делать, если купленный сценарий не работает?',
                a: 'Свяжитесь с продавцом через раздел «Вопросы» на странице сценария. Если продавец не отвечает — обратитесь в поддержку.',
              },
              {
                q: 'Как изменить цену после публикации?',
                a: 'Вы можете изменить цену в любой момент на странице редактирования листинга. Изменение цены не требует повторной модерации.',
              },
              {
                q: 'Можно ли продавать сценарий в других маркетплейсах?',
                a: 'Это зависит от типа лицензии, которую вы выбрали. Для WHITE_LABEL — да, для остальных — эксклюзивно на QuestForge.',
              },
              {
                q: 'Как долго длится модерация?',
                a: 'Обычно до 24 часов. В редких случаях может занимать до 48 часов.',
              },
              {
                q: 'Можно ли выставить бесплатный сценарий?',
                a: 'Да, вы можете установить цену 0. Бесплатные сценарии также проходят модерацию.',
              },
              {
                q: 'Как узнать, что мой сценарий купили?',
                a: 'Вы получите уведомление о покупке. Также статистика доступна в разделе «Аналитика» кабинета продавца.',
              },
              {
                q: 'Какая минимальная сумма для вывода?',
                a: 'Минимальная сумма для запроса выплаты — 500₽.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-background-modifier-hover rounded-lg p-4 border border-border">
                <h3 className="font-semibold text-text-primary text-sm mb-1">❓ {faq.q}</h3>
                <p className="text-sm text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Советы */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">6. Советы и лучшие практики</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">🛒 Покупателям</h3>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li>Внимательно читайте описание и тип лицензии перед покупкой</li>
                <li>Изучайте отзывы других покупателей</li>
                <li>Задавайте вопросы продавцу, если что-то неясно</li>
                <li>Проверяйте совместимость сценария с вашими задачами</li>
              </ul>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">📤 Продавцам</h3>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li>Делайте качественные скриншоты и описания</li>
                <li>Устанавливайте адекватную цену</li>
                <li>Отвечайте на вопросы покупателей оперативно</li>
                <li>Регулярно обновляйте сценарии и добавляйте новые</li>
                <li>Следите за аналитикой, чтобы понимать спрос</li>
              </ul>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">📸 Качественное изображение</h3>
              <p className="text-xs text-text-secondary">Хорошая обложка увеличивает продажи на 30%. Используйте яркие, читаемые изображения формата 16:9.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">📝 Подробное описание</h3>
              <p className="text-xs text-text-secondary">Опишите, для кого подходит сценарий, сколько времени занимает, какие нужны материалы. Чем подробнее — тем выше доверие.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">🏷️ Правильные теги</h3>
              <p className="text-xs text-text-secondary">Используйте релевантные теги: «квест», «квиз», «мафия», «городской», «детский», «командный». Это поможет покупателям найти ваш сценарий.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">⭐ Работа с отзывами</h3>
              <p className="text-xs text-text-secondary">Положительные отзывы — лучшая реклама. Если получили негативный отзыв, свяжитесь с покупателем и решите проблему.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-border pt-8 pb-16 text-center">
          <p className="text-text-secondary text-sm">
            QuestForge — операционная система для любых игр. 🚀
          </p>
        </div>
      </div>
    </div>
  );
}