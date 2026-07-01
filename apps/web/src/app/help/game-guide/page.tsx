import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Инструкция по созданию игры | QuestForge',
  description: 'Полное руководство по созданию игры в QuestForge: от настройки до запуска и управления командой',
};

export default function GameGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/20 via-background to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-16 relative">
          <Link
            href="/organizer/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к играм
          </Link>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            🎮 Инструкция по созданию игры
          </h1>
          <p className="text-lg text-text-secondary">
            Полное руководство: от первой настройки до запуска игроков и управления в реальном времени
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">

        {/* 1. Введение */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">1. Введение</h2>
          <div className="max-w-none">
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Игра</strong> в QuestForge — это связующее звено между 
              <strong className="text-text-primary"> сценарием</strong> (набором заданий) и 
              <strong className="text-text-primary"> игроками</strong>. 
              Именно игра определяет: когда старт, кто участвует, сколько команд, какие правила.
            </p>
            <p className="text-text-secondary leading-relaxed mt-2">
              В отличие от сценария (который можно переиспользовать), игра — это конкретное событие 
              с датой, городом, командами и организатором.
            </p>
            <div className="bg-background-modifier-hover rounded-lg p-4 mt-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🎯 Что вы можете сделать</h3>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li>✅ Создать игру на основе любого сценария</li>
                <li>✅ Настроить дату, время, город и длительность</li>
                <li>✅ Открыть и закрыть регистрацию команд</li>
                <li>✅ Запустить игру и следить за прогрессом в реальном времени</li>
                <li>✅ Завершить игру и посмотреть результаты</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Быстрый старт */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">2. Быстрый старт</h2>
          <div className="space-y-4">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Шаг 1: Создайте игру</h3>
              <p className="text-sm text-text-secondary">
                Перейдите в <Link href="/organizer/games/create" className="text-primary hover:text-primary-hover">Создать игру</Link>. 
                Заполните название, описание, выберите сценарий, укажите город, дату и время старта.
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Шаг 2: Опубликуйте игру</h3>
              <p className="text-sm text-text-secondary">
                После создания игра находится в статусе <strong className="text-text-primary">DRAFT</strong>. 
                Нажмите «Опубликовать», чтобы перевести её в <strong className="text-text-primary">PUBLISHED</strong> — 
                теперь игроки могут видеть игру в каталоге.
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Шаг 3: Откройте регистрацию</h3>
              <p className="text-sm text-text-secondary">
                Нажмите «Открыть регистрацию» — статус сменится на <strong className="text-text-primary">REGISTRATION_OPEN</strong>. 
                Игроки смогут зарегистрировать свои команды. После регистрации они попадают в лобби.
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Шаг 4: Запустите игру</h3>
              <p className="text-sm text-text-secondary">
                Когда все команды зарегистрированы и готовы, нажмите «Запустить игру». 
                Система автоматически создаст игровые сессии для всех команд, и игроки увидят первое задание.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Статусы игры */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">3. Статусы игры</h2>
          <p className="text-text-secondary mb-4">
            Игра проходит через последовательность статусов. Каждый статус определяет, что могут делать игроки и организатор.
          </p>
          <div className="space-y-3">
            {[
              { status: 'DRAFT', icon: '📝', color: 'text-text-muted', desc: 'Черновик. Игру видите только вы. Можно редактировать все настройки.', actions: 'Редактировать, удалить, опубликовать' },
              { status: 'PUBLISHED', icon: '📢', color: 'text-primary', desc: 'Опубликована. Игра видна в каталоге, но регистрация ещё закрыта.', actions: 'Открыть регистрацию, запустить сразу, отменить' },
              { status: 'REGISTRATION_OPEN', icon: '📝', color: 'text-success', desc: 'Регистрация открыта. Команды могут записаться на игру.', actions: 'Закрыть регистрацию, запустить сразу, отменить' },
              { status: 'REGISTRATION_CLOSED', icon: '🔒', color: 'text-info', desc: 'Регистрация закрыта. Новые команды не могут записаться.', actions: 'Перейти в лобби, отменить' },
              { status: 'LOBBY', icon: '🔄', color: 'text-warning', desc: 'Лобби. Команды подтверждают готовность. Организатор готовится к старту.', actions: 'Запустить игру, отменить' },
              { status: 'RUNNING', icon: '🎮', color: 'text-warning', desc: 'Игра идёт. Команды проходят задания. Организатор следит за прогрессом.', actions: 'Завершить игру' },
              { status: 'FINISHED', icon: '🏁', color: 'text-text-secondary', desc: 'Игра завершена. Доступны результаты и статистика.', actions: 'Просмотр результатов' },
            ].map(item => (
              <div key={item.status} className="flex items-start gap-4 bg-background-modifier-hover rounded-lg p-4 border border-border">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold text-sm ${item.color}`}>{item.status}</h3>
                  </div>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
                  <p className="text-xs text-text-muted mt-1">Действия: {item.actions}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Управление игрой */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">4. Управление игрой</h2>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Панель организатора</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border mb-4">
            <p className="text-sm text-text-secondary mb-3">
              После создания игры вы попадаете на страницу управления. Здесь доступны:
            </p>
            <ul className="text-sm text-text-secondary space-y-2">
              <li><strong className="text-text-primary">📋 Список команд</strong> — кто зарегистрирован, статус готовности</li>
              <li><strong className="text-text-primary">🔘 Кнопки управления</strong> — смена статусов игры (опубликовать, открыть регистрацию, запустить и т.д.)</li>
              <li><strong className="text-text-primary">📊 Прогресс</strong> — во время игры видно, на каком задании каждая команда</li>
              <li><strong className="text-text-primary">⚙️ Настройки</strong> — редактирование игры, смена сценария</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Страница RUNNING</h3>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
            <p className="text-sm text-text-secondary mb-3">
              Когда игра запущена, организатор видит специальную страницу с:
            </p>
            <ul className="text-sm text-text-secondary space-y-2">
              <li><strong className="text-text-primary">📊 Прогресс команд</strong> — текущий узел, счёт, штрафы</li>
              <li><strong className="text-text-primary">⏱ Таймер</strong> — оставшееся время игры</li>
              <li><strong className="text-text-primary">🏁 Кнопка завершения</strong> — досрочное завершение игры</li>
            </ul>
          </div>
        </section>

        {/* 5. Регистрация команд */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">5. Регистрация команд</h2>
          <div className="space-y-4">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🔗 Share-ссылка</h3>
              <p className="text-sm text-text-secondary">
                После публикации игры у неё появляется уникальная share-ссылка вида 
                <code className="text-primary mx-1">/play/XXXXXXXX</code>. 
                Отправьте эту ссылку игрокам — они перейдут на страницу регистрации.
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">👥 Как игрок регистрируется</h3>
              <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
                <li>Переходит по share-ссылке</li>
                <li>Выбирает команду (или создаёт новую)</li>
                <li>Нажимает «Зарегистрироваться»</li>
                <li>Попадает в лобби — видит список команд и таймер до старта</li>
                <li>Нажимает «Готов» — организатор видит, что команда готова</li>
              </ol>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🔄 Повторный вход</h3>
              <p className="text-sm text-text-secondary">
                Если игрок закрыл вкладку и вернулся по share-ссылке:
              </p>
              <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside mt-1">
                <li><strong className="text-text-primary">До старта:</strong> автоматически перенаправляется в лобби</li>
                <li><strong className="text-text-primary">Во время игры:</strong> автоматически перенаправляется на текущее задание</li>
                <li><strong className="text-text-primary">После игры:</strong> автоматически перенаправляется на страницу результатов</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Лобби */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">6. Лобби (ожидание старта)</h2>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
            <p className="text-sm text-text-secondary mb-3">
              Лобби — это комната ожидания перед стартом игры. Здесь игроки видят:
            </p>
            <ul className="text-sm text-text-secondary space-y-2">
              <li><strong className="text-text-primary">📋 Список команд</strong> — все зарегистрированные команды и их статус готовности</li>
              <li><strong className="text-text-primary">⏱ Таймер</strong> — сколько осталось до автоматического старта</li>
              <li><strong className="text-text-primary">✅ Кнопка «Готов»</strong> — команда подтверждает, что готова к игре</li>
              <li><strong className="text-text-primary">🚀 Авто-старт</strong> — если все команды готовы и время старта наступило, игра запускается автоматически</li>
            </ul>
          </div>
        </section>

        {/* 7. Прохождение игры */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">7. Прохождение игры</h2>
          <div className="space-y-4">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🎯 Задания</h3>
              <p className="text-sm text-text-secondary">
                После старта каждая команда видит текущее задание. В зависимости от типа миссии, 
                игрок может: ввести текст, выбрать вариант, загрузить фото, отметить GPS-координаты, 
                отсканировать QR-код и т.д.
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">💡 Подсказки</h3>
              <p className="text-sm text-text-secondary">
                Если команда затрудняется с ответом, можно запросить подсказку. 
                Каждая подсказка уменьшает итоговый счёт (штрафные очки).
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">📦 Инвентарь</h3>
              <p className="text-sm text-text-secondary">
                Некоторые задания могут давать предметы в инвентарь команды. 
                Предметы могут понадобиться для последующих заданий.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Завершение игры */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">8. Завершение игры</h2>
          <div className="space-y-4">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🏁 Завершение организатором</h3>
              <p className="text-sm text-text-secondary">
                Организатор может завершить игру досрочно кнопкой «Завершить игру» на странице RUNNING. 
                Все команды увидят страницу финиша.
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">📊 Результаты</h3>
              <p className="text-sm text-text-secondary">
                После завершения игры доступны: итоговый счёт каждой команды, 
                количество штрафов, пройденные задания, общее время прохождения.
              </p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">⭐ Отзывы</h3>
              <p className="text-sm text-text-secondary">
                Игроки могут оставить отзыв о игре — оценку и комментарий. 
                Отзывы видны на странице игры в каталоге.
              </p>
            </div>
          </div>
        </section>

        {/* 9. Часто задаваемые вопросы */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">9. Часто задаваемые вопросы</h2>
          <div className="space-y-3">
            {[
              {
                q: 'Можно ли изменить сценарий после создания игры?',
                a: 'Да, пока игра в статусе DRAFT или PUBLISHED. После открытия регистрации сценарий менять нельзя.',
              },
              {
                q: 'Сколько команд может участвовать?',
                a: 'Максимальное количество команд задаётся при создании игры (поле maxTeams). По умолчанию — 10.',
              },
              {
                q: 'Что если команда не готова к старту?',
                a: 'Организатор может запустить игру вручную, даже если не все команды готовы. Неготовые команды начнут игру с опозданием.',
              },
              {
                q: 'Можно ли запустить игру раньше запланированного времени?',
                a: 'Да, если включена опция «Разрешить ранний старт» и все команды подтвердили готовность.',
              },
              {
                q: 'Что видит организатор во время игры?',
                a: 'Прогресс всех команд: текущее задание, счёт, штрафы, историю ответов.',
              },
              {
                q: 'Может ли игрок отвечать с другого устройства?',
                a: 'Да. Достаточно зайти по той же share-ссылке — система автоматически восстановит сессию.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-background-modifier-hover rounded-lg p-4 border border-border">
                <h3 className="font-semibold text-text-primary text-sm mb-1">❓ {faq.q}</h3>
                <p className="text-sm text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 10. Советы */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">10. Советы и лучшие практики</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">📢 Тестируйте перед запуском</h3>
              <p className="text-xs text-text-secondary">Создайте тестовую команду и пройдите игру от начала до конца, чтобы убедиться, что всё работает.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">🔗 Делитесь ссылкой заранее</h3>
              <p className="text-xs text-text-secondary">Отправьте share-ссылку игрокам за несколько дней до старта, чтобы они успели зарегистрироваться.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">📊 Следите за прогрессом</h3>
              <p className="text-xs text-text-secondary">Во время игры открывайте страницу RUNNING — вы увидите, какие команды отстают и кому可能需要 помощь.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">🎯 Начинайте с малого</h3>
              <p className="text-xs text-text-secondary">Для первой игры выберите короткий сценарий (30-40 минут) и 2-3 команды, чтобы освоиться с управлением.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">📝 Используйте готовые сценарии</h3>
              <p className="text-xs text-text-secondary">В маркетплейсе есть готовые сценарии от других организаторов — используйте их как основу для своей игры.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">📱 Напоминайте игрокам</h3>
              <p className="text-xs text-text-secondary">За час до старта отправьте игрокам напоминание со share-ссылкой, чтобы они не забыли зарегистрироваться.</p>
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