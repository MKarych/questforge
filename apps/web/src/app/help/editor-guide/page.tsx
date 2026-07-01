import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Инструкция по редактору сценариев | QuestForge',
  description: 'Полное руководство по редактору сценариев QuestForge: от создания первого сценария до продвинутых возможностей',
};

export default function EditorGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/20 via-background to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-16 relative">
          <Link
            href="/organizer/scenarios"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к сценариям
          </Link>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            📖 Инструкция по редактору сценариев
          </h1>
          <p className="text-lg text-text-secondary">
            Полное руководство по созданию любых игр: от простого квиза до много-городовой мафии
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        
        {/* 1. Введение */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">1. Введение</h2>
          <div className="max-w-none">
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text-primary">QuestForge</strong> — это не конструктор квестов. 
              Это <strong className="text-text-primary">операционная система для любых игр</strong>.
            </p>
            <p className="text-text-secondary leading-relaxed mt-2">
              Редактор сценариев позволяет создавать игры любой сложности: от простых городских квестов 
              до много-городовой мафии с ролями, фазами дня/ночи, параллельными сценариями и экономикой.
            </p>
            <div className="bg-background-modifier-hover rounded-lg p-4 mt-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🎯 6 примитивов Runtime</h3>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li><strong className="text-primary">Scene</strong> — сцена (локация, квиз, диалог, слайд)</li>
                <li><strong className="text-primary">Action</strong> — действие игрока (ответ, фото, GPS)</li>
                <li><strong className="text-primary">State</strong> — состояние игры (переменные, инвентарь, очки)</li>
                <li><strong className="text-primary">Condition</strong> — условие (AST-дерево с AND/OR)</li>
                <li><strong className="text-primary">Event</strong> — событие (триггеры, реакции)</li>
                <li><strong className="text-primary">View</strong> — представление (как это видит игрок)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Быстрый старт */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">2. Быстрый старт</h2>
          <div className="space-y-4">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Шаг 1: Создайте сценарий</h3>
              <p className="text-sm text-text-secondary">Нажмите «Создать сценарий» и выберите шаблон или начните с пустого.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Шаг 2: Добавьте сцены</h3>
              <p className="text-sm text-text-secondary">Перетащите блоки из палитры слева на холст. Соедините их линиями-переходами.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Шаг 3: Настройте миссии</h3>
              <p className="text-sm text-text-secondary">В каждой сцене добавьте миссии: текстовый ответ, фото, GPS, QR, выбор варианта и т.д.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Шаг 4: Проверьте и сохраните</h3>
              <p className="text-sm text-text-secondary">Используйте панель валидации для проверки ошибок, затем режим предпросмотра для теста.</p>
            </div>
          </div>
        </section>

        {/* 3. Основные понятия */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">3. Основные понятия</h2>
          
          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Типы сцен</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: '🚀', name: 'Старт', desc: 'Начальная точка сценария' },
              { icon: '🏁', name: 'Финиш', desc: 'Конечная точка' },
              { icon: '📍', name: 'Локация', desc: 'GPS-точка с проверкой местоположения' },
              { icon: '📝', name: 'Квиз', desc: 'Вопросы, текстовые задания, коды' },
              { icon: '💬', name: 'Диалог', desc: 'Разговор с NPC с ветвлением' },
              { icon: '🖼', name: 'Слайд', desc: 'Медиа-контент: изображения, аудио, видео' },
              { icon: '🔄', name: 'Цикл', desc: 'Повторение набора сцен N раз' },
              { icon: '🔀', name: 'Кастом', desc: 'Специальные сцены: голосования, аукционы' },
            ].map(item => (
              <div key={item.name} className="flex items-start gap-3 bg-background-modifier-hover rounded-lg p-3 border border-border">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <h4 className="font-semibold text-text-primary text-sm">{item.name}</h4>
                  <p className="text-xs text-text-secondary">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Типы миссий</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { icon: '📝', name: 'Text', desc: 'Ввод текста' },
              { icon: '🔢', name: 'Code', desc: 'Ввод кода' },
              { icon: '📷', name: 'Photo', desc: 'Загрузка фото' },
              { icon: '📍', name: 'GPS', desc: 'Проверка координат' },
              { icon: '📱', name: 'QR', desc: 'Сканирование QR' },
              { icon: '🎯', name: 'Choice', desc: 'Выбор варианта' },
              { icon: '🎒', name: 'Collect', desc: 'Сбор предмета' },
              { icon: '💬', name: 'Dialogue', desc: 'Диалог с NPC' },
              { icon: '🎵', name: 'Audio', desc: 'Аудио-задание' },
              { icon: '🎬', name: 'Video', desc: 'Видео-задание' },
              { icon: '📦', name: 'Inventory Get', desc: 'Получить предмет' },
              { icon: '🔍', name: 'Inventory Check', desc: 'Проверить предмет' },
              { icon: '🏆', name: 'Achievement', desc: 'Достижение' },
            ].map(item => (
              <div key={item.name} className="flex items-center gap-2 bg-background-modifier-hover rounded-lg p-2 border border-border">
                <span>{item.icon}</span>
                <div>
                  <h4 className="font-semibold text-text-primary text-xs">{item.name}</h4>
                  <p className="text-[10px] text-text-secondary">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">Переходы и связи</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p><strong className="text-text-primary">Auto</strong> — автоматический переход после выполнения миссии</p>
            <p><strong className="text-text-primary">Conditional</strong> — переход только при выполнении условия (AND/OR дерево)</p>
            <p><strong className="text-text-primary">Timer</strong> — переход по истечении таймера</p>
          </div>
        </section>

        {/* 4. Продвинутые возможности */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">4. Продвинутые возможности</h2>
          
          <div className="space-y-6">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🎭 Система ролей</h3>
              <p className="text-sm text-text-secondary mb-2">Создавайте роли с разными правами и условиями победы. Идеально для мафии, детективов и командных игр.</p>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li>Каждая роль имеет набор разрешений (vote, kill, investigate, heal)</li>
                <li>Условия победы задаются через Condition AST</li>
                <li>Роли могут быть скрытыми или видимыми всем</li>
              </ul>
            </div>

            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">⚖️ Конструктор условий (Condition Builder)</h3>
              <p className="text-sm text-text-secondary mb-2">Древовидный конструктор с AND/OR группами для создания сложной логики.</p>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li>Проверка переменных: <code className="text-primary">score {'>'} 100</code></li>
                <li>Проверка инвентаря: <code className="text-primary">has item &laquo;ключ&raquo;</code></li>
                <li>Проверка роли: <code className="text-primary">role = &laquo;мафия&raquo;</code></li>
                <li>Проверка времени: <code className="text-primary">elapsed {'>'} 300</code></li>
                <li>Случайное условие: <code className="text-primary">random {'<'} 0.5</code></li>
              </ul>
            </div>

            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">⚡ Триггеры и события</h3>
              <p className="text-sm text-text-secondary mb-2">Реактивная система: сценарий сам отвечает на действия игроков.</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">События (18 типов):</h4>
                  <ul className="text-text-secondary space-y-0.5">
                    <li>🚪 Вход/выход из сцены</li>
                    <li>✅ Завершение/провал миссии</li>
                    <li>👍 Правильный/неправильный ответ</li>
                    <li>⏱ Старт/конец таймера</li>
                    <li>📦 Получение/трата предмета</li>
                    <li>🔨 Крафт/использование предмета</li>
                    <li>🏆 Получение достижения</li>
                    <li>👤 Назначение роли</li>
                    <li>📊 Изменение переменной</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Действия (12 типов):</h4>
                  <ul className="text-text-secondary space-y-0.5">
                    <li>📊 set_variable</li>
                    <li>➕ add_score</li>
                    <li>📍 teleport</li>
                    <li>🔔 show_notification</li>
                    <li>⏱ start/stop_timer</li>
                    <li>🔊 play_sound</li>
                    <li>📋 show_modal</li>
                    <li>👤 assign_role</li>
                    <li>📦 give/remove_item</li>
                    <li>🔨 craft/use/trade_item</li>
                    <li>📡 emit_event</li>
                    <li>🌐 call_api</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🔄 Циклы</h3>
              <p className="text-sm text-text-secondary mb-2">Повторяйте набор сцен несколько раз или пока выполняется условие.</p>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li><strong className="text-text-primary">For</strong> — N раз (например, 5 раундов квиза)</li>
                <li><strong className="text-text-primary">While</strong> — пока условие истинно (например, пока alive_players {'>'} 1)</li>
                <li><strong className="text-text-primary">ForEach</strong> — по массиву элементов</li>
                <li>Защита от бесконечных циклов: maxIterations (по умолчанию 100)</li>
              </ul>
            </div>

            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">📂 Параллельные сценарии</h3>
              <p className="text-sm text-text-secondary mb-2">Запускайте несколько сценариев одновременно с синхронизацией.</p>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li>Каждый сценарий имеет свои переменные и состояние</li>
                <li>Точки синхронизации: wait_all, wait_any, sequence</li>
                <li>Общие глобальные переменные между сценариями</li>
                <li>Меж-сценарные события (emit/listen)</li>
              </ul>
            </div>

            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🎒 Инвентарь, крафт и торговля</h3>
              <p className="text-sm text-text-secondary mb-2">Полноценная экономическая система внутри игры.</p>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li><strong className="text-text-primary">Инвентарь:</strong> предметы с типами (key, consumable, weapon, armor), редкостью, весом, стаками</li>
                <li><strong className="text-text-primary">Крафт:</strong> рецепты с ингредиентами, шансом успеха, кулдауном</li>
                <li><strong className="text-text-primary">Торговля:</strong> обмен предметами и золотом между командами</li>
                <li><strong className="text-text-primary">Использование:</strong> предметы с эффектами (heal, damage, buff, teleport)</li>
              </ul>
            </div>

            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🌓 Фазы игры</h3>
              <p className="text-sm text-text-secondary mb-2">Управляйте глобальным состоянием игры: день/ночь, раунды, этапы.</p>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li>Фазы: day, night, round, free, custom</li>
                <li>Циклы день/ночь с автоматическим переключением</li>
                <li>Раунды с настраиваемым количеством</li>
                <li>Ограничения: какие действия/сцены/миссии доступны в каждой фазе</li>
                <li>Триггеры на начало/конец фазы или раунда</li>
              </ul>
            </div>

            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">👥 Мультиплеер</h3>
              <p className="text-sm text-text-secondary mb-2">Синхронные механики для нескольких игроков.</p>
              <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                <li><strong className="text-text-primary">Голосование:</strong> все выбирают вариант, результаты скрыты или видны</li>
                <li><strong className="text-text-primary">Аукцион:</strong> ставки на редкие предметы</li>
                <li><strong className="text-text-primary">Челлендж:</strong> кто быстрее выполнит задание</li>
                <li><strong className="text-text-primary">Одновременный выбор:</strong> игроки не видят выбор друг друга</li>
                <li><strong className="text-text-primary">Синхронизированный таймер:</strong> общий таймер для всех</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. AI-ассистент */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">5. AI-ассистент</h2>
          <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
            <p className="text-sm text-text-secondary mb-3">
              AI-ассистент помогает создавать сценарии на естественном языке. Просто опишите, какую игру вы хотите.
            </p>
            <h4 className="font-semibold text-text-primary mb-2">Примеры промптов:</h4>
            <ul className="text-xs text-text-secondary space-y-1">
              <li className="bg-background/50 rounded p-2">«Создай квиз из 10 вопросов о космосе с вариантами ответов»</li>
              <li className="bg-background/50 rounded p-2">«Сделай мафию на 8 игроков с ролями мирный, мафия, комиссар, доктор»</li>
              <li className="bg-background/50 rounded p-2">«Создай городской квест с 5 GPS-точками, фото и QR-кодами»</li>
            </ul>
          </div>
        </section>

        {/* 6. Валидация и тестирование */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">6. Валидация и тестирование</h2>
          <div className="space-y-3">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Панель валидации</h3>
              <p className="text-sm text-text-secondary">Автоматически проверяет: наличие стартовой сцены, достижимость всех сцен, отсутствие бесконечных циклов, корректность конфигураций миссий, использование переменных.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Тестовый режим</h3>
              <p className="text-sm text-text-secondary">Позволяет пройти сценарий от начала до конца в изолированном режиме, проверить все переходы и условия, протестировать триггеры.</p>
            </div>
          </div>
        </section>

        {/* 7. Публикация и экспорт */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">7. Публикация и экспорт</h2>
          <div className="space-y-3">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">💾 Сохранение на сервер</h3>
              <p className="text-sm text-text-secondary">Сценарий сохраняется в вашем аккаунте. Можно редактировать, публиковать и делиться.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">📤 Экспорт в JSON</h3>
              <p className="text-sm text-text-secondary">Скачайте сценарий в формате JSON для резервного копирования или передачи другому организатору.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2">🌐 Публикация в маркетплейс</h3>
              <p className="text-sm text-text-secondary">Опубликуйте сценарий в общем доступе, установите цену и лицензию (single, multi_city, commercial, white_label).</p>
            </div>
          </div>
        </section>

        {/* 8. Советы и лучшие практики */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">8. Советы и лучшие практики</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">💡 Начинайте с шаблона</h3>
              <p className="text-xs text-text-secondary">Используйте готовые шаблоны как основу — это сэкономит часы работы.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">🔍 Используйте условия</h3>
              <p className="text-xs text-text-secondary">Ветвления делают игру нелинейной и интересной. Игроки любят чувствовать, что их выбор влияет на сюжет.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">⚡ Триггеры — ваши друзья</h3>
              <p className="text-xs text-text-secondary">Автоматизируйте всё, что можно автоматизировать: начисление очков, уведомления, таймеры.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">🧪 Тестируйте перед публикацией</h3>
              <p className="text-xs text-text-secondary">Всегда проходите сценарий в тестовом режиме перед тем, как запустить его для игроков.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">📊 Используйте переменные</h3>
              <p className="text-xs text-text-secondary">Переменные позволяют отслеживать прогресс, создавать динамические условия и персонализировать игру.</p>
            </div>
            <div className="bg-background-modifier-hover rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">🎯 Думайте о мобильных</h3>
              <p className="text-xs text-text-secondary">Игроки будут проходить игру на телефонах. Убедитесь, что интерфейс удобен на маленьких экранах.</p>
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