'use client';

import Link from 'next/link';
import Header from '@/components/ui/Header';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Навигация */}
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Главная</Link>
            <span>→</span>
            <span className="text-text-primary">О нас</span>
          </div>

          <h1 className="text-3xl font-bold text-text-primary mb-8">О платформе «Город Приключений»</h1>

          <div className="space-y-8 text-text-secondary leading-relaxed">
            {/* О проекте */}
            <section className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Что такое «Город Приключений»?</h2>
              <p className="mb-3">
                «Город Приключений» — это платформа нового поколения для создания и прохождения городских квестов. 
                Мы объединяем организаторов, сценаристов и игроков в едином пространстве, где каждый может стать 
                частью захватывающих приключений в своём городе.
              </p>
              <p className="mb-3">
                Наша миссия — сделать городские игры доступными для всех. Мы предоставляем удобные инструменты 
                для создания сценариев, управления командами и проведения игр, а игрокам — возможность находить 
                и проходить увлекательные квесты рядом с домом.
              </p>
              <p>
                Платформа находится в стадии активной разработки, но уже сейчас вы можете создавать сценарии, 
                формировать команды и проходить игры. Мы постоянно добавляем новый функционал и улучшаем 
                пользовательский опыт.
              </p>
            </section>

            {/* Возможности */}
            <section className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Наши возможности</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-elevated rounded-lg p-4">
                  <div className="text-2xl mb-2">🎮</div>
                  <h3 className="font-semibold text-text-primary mb-1">Создание игр</h3>
                  <p className="text-sm">
                    Интуитивный редактор сценариев с поддержкой текстовых миссий, точек сбора, 
                    головоломок и заданий с проверкой по геолокации.
                  </p>
                </div>
                <div className="bg-surface-elevated rounded-lg p-4">
                  <div className="text-2xl mb-2">👥</div>
                  <h3 className="font-semibold text-text-primary mb-1">Командная игра</h3>
                  <p className="text-sm">
                    Создавайте команды, приглашайте друзей и проходите квесты вместе. 
                    Соревнуйтесь с другими командами за место в рейтинге.
                  </p>
                </div>
                <div className="bg-surface-elevated rounded-lg p-4">
                  <div className="text-2xl mb-2">📱</div>
                  <h3 className="font-semibold text-text-primary mb-1">Мобильность</h3>
                  <p className="text-sm">
                    Все игры проходят прямо на улицах города. Нужен только смартфон 
                    и желание приключений. Скоро — нативные мобильные приложения.
                  </p>
                </div>
                <div className="bg-surface-elevated rounded-lg p-4">
                  <div className="text-2xl mb-2">🏆</div>
                  <h3 className="font-semibold text-text-primary mb-1">Рейтинги и статистика</h3>
                  <p className="text-sm">
                    Отслеживайте свой прогресс, сравнивайте результаты с другими игроками 
                    и получайте достижения за пройденные игры.
                  </p>
                </div>
              </div>
            </section>

            {/* Для кого */}
            <section className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Для кого наша платформа</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">🎯 Для игроков</h3>
                  <p className="text-sm">
                    Ищете необычный досуг? Хотите интересно провести время с друзьями или семьёй? 
                    В каталоге игр вы найдёте квесты на любой вкус — от прогулок по историческому 
                    центру до головоломок в парках.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">🎪 Для организаторов</h3>
                  <p className="text-sm">
                    Хотите проводить собственные игры? Станьте организатором — создавайте сценарии, 
                    управляйте расписанием, собирайте команды и делитесь своими приключениями 
                    с городом.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">🏢 Для бизнеса</h3>
                  <p className="text-sm">
                    Ищете нестандартный формат для тимбилдинга или мероприятия? Мы предлагаем 
                    корпоративные квесты, которые помогут сплотить команду и подарить новые эмоции.
                  </p>
                </div>
              </div>
            </section>

            {/* Статистика */}
            <section className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Платформа в цифрах</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-surface-elevated rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">120+</div>
                  <div className="text-xs text-text-muted">игр</div>
                </div>
                <div className="bg-surface-elevated rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">430+</div>
                  <div className="text-xs text-text-muted">команд</div>
                </div>
                <div className="bg-surface-elevated rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">5 800+</div>
                  <div className="text-xs text-text-muted">игроков</div>
                </div>
                <div className="bg-surface-elevated rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">15</div>
                  <div className="text-xs text-text-muted">городов</div>
                </div>
                <div className="bg-surface-elevated rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">120+</div>
                  <div className="text-xs text-text-muted">организаторов</div>
                </div>
              </div>
            </section>

            {/* Контакты */}
            <section className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Свяжитесь с нами</h2>
              <p className="mb-4">
                У вас есть вопросы, предложения или вы хотите стать частью нашей команды? 
                Мы всегда открыты к диалогу!
              </p>
              <div className="space-y-2">
                <p>
                  <strong className="text-text-primary">Email:</strong>{' '}
                  <a href="mailto:hello@adventure-engine.com" className="text-primary hover:text-primary-hover transition-colors">
                    hello@adventure-engine.com
                  </a>
                </p>
                <p>
                  <strong className="text-text-primary">Поддержка:</strong>{' '}
                  <a href="mailto:support@adventure-engine.com" className="text-primary hover:text-primary-hover transition-colors">
                    support@adventure-engine.com
                  </a>
                </p>
                <p>
                  <strong className="text-text-primary">Telegram:</strong>{' '}
                  <a href="https://t.me/adventureengine" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors">
                    @adventureengine
                  </a>
                </p>
                <p>
                  <strong className="text-text-primary">VK:</strong>{' '}
                  <a href="https://vk.com/adventureengine" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors">
                    vk.com/adventureengine
                  </a>
                </p>
              </div>
            </section>

            {/* Дата */}
            <div className="text-center text-sm text-text-muted">
              <p>Последнее обновление: 25 июня 2026 г.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}