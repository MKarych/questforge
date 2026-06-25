'use client';

import Link from 'next/link';
import Header from '@/components/ui/Header';

export default function ContactsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Навигация */}
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Главная</Link>
            <span>→</span>
            <span className="text-text-primary">Контакты</span>
          </div>

          <h1 className="text-3xl font-bold text-text-primary mb-8">Контакты</h1>

          <div className="space-y-8 text-text-secondary leading-relaxed">
            {/* Основные контакты */}
            <section className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Как с нами связаться</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">📧</span>
                  <div>
                    <p className="font-medium text-text-primary">Электронная почта</p>
                    <p className="text-sm">
                      <a href="mailto:hello@adventure-engine.com" className="text-primary hover:text-primary-hover transition-colors">
                        hello@adventure-engine.com
                      </a>
                      — общие вопросы
                    </p>
                    <p className="text-sm">
                      <a href="mailto:support@adventure-engine.com" className="text-primary hover:text-primary-hover transition-colors">
                        support@adventure-engine.com
                      </a>
                      — служба поддержки
                    </p>
                    <p className="text-sm">
                      <a href="mailto:privacy@adventure-engine.com" className="text-primary hover:text-primary-hover transition-colors">
                        privacy@adventure-engine.com
                      </a>
                      — вопросы конфиденциальности
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">✈️</span>
                  <div>
                    <p className="font-medium text-text-primary">Telegram</p>
                    <p className="text-sm">
                      <a href="https://t.me/adventureengine" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors">
                        @adventureengine
                      </a>
                      — новости и анонсы
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">📱</span>
                  <div>
                    <p className="font-medium text-text-primary">VK</p>
                    <p className="text-sm">
                      <a href="https://vk.com/adventureengine" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors">
                        vk.com/adventureengine
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">▶️</span>
                  <div>
                    <p className="font-medium text-text-primary">YouTube</p>
                    <p className="text-sm">
                      <a href="https://youtube.com/@adventureengine" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors">
                        youtube.com/@adventureengine
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Поддержка */}
            <section className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Служба поддержки</h2>
              <p className="mb-3">
                Если у вас возникли проблемы при использовании платформы, вы можете обратиться в службу поддержки.
                Мы стараемся отвечать на все обращения в течение 24 часов в рабочие дни.
              </p>
              <p className="mb-3">
                Перед обращением рекомендуем ознакомиться с{' '}
                <Link href="/faq" className="text-primary hover:text-primary-hover transition-colors">
                  разделом FAQ
                </Link>
                — возможно, ответ на ваш вопрос уже есть там.
              </p>
              <p>
                <Link
                  href="/support"
                  className="inline-block btn-primary text-sm py-2 px-4 mt-2"
                >
                  Написать в поддержку
                </Link>
              </p>
            </section>

            {/* Реквизиты (тестовые) */}
            <section className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Реквизиты</h2>
              <p className="text-sm text-text-muted mb-3">* Тестовые данные для ознакомления</p>
              <div className="space-y-2">
                <p><strong className="text-text-primary">Наименование:</strong> ООО «Город Приключений» (тестовые данные)</p>
                <p><strong className="text-text-primary">Юридический адрес:</strong> 123456, г. Москва, ул. Тестовая, д. 1, оф. 1 (тестовые данные)</p>
                <p><strong className="text-text-primary">ИНН:</strong> 1234567890 (тестовые данные)</p>
                <p><strong className="text-text-primary">ОГРН:</strong> 1234567890123 (тестовые данные)</p>
                <p><strong className="text-text-primary">Телефон:</strong> +7 (999) 123-45-67 (тестовые данные)</p>
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