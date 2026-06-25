'use client';

import Link from 'next/link';
import Header from '@/components/ui/Header';
import SupportForm from '@/components/ui/SupportForm';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
            <Link href="/" className="hover:text-primary transition-colors">
              Главная
            </Link>
            <span>→</span>
            <span className="text-text-primary font-medium">Поддержка</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-3">
              Служба поддержки
            </h1>
            <p className="text-text-secondary text-lg">
              Не нашли ответ в FAQ? Опишите вашу проблему, и мы поможем
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  Форма обратной связи
                </h2>
                <SupportForm />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* FAQ Link */}
              <div className="card p-6">
                <div className="text-3xl mb-3">❓</div>
                <h3 className="font-semibold text-text-primary mb-2">
                  Часто задаваемые вопросы
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Возможно, ответ на ваш вопрос уже есть в нашем FAQ
                </p>
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium text-sm transition-colors"
                >
                  Перейти в FAQ →
                </Link>
              </div>

              {/* Data Processing */}
              <div className="card p-6">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="font-semibold text-text-primary mb-2">
                  Обработка данных
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Все персональные данные обрабатываются в соответствии с Политикой конфиденциальности. Мы используем защищённое соединение и не передаём данные третьим лицам.
                </p>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium text-sm transition-colors"
                >
                  Политика конфиденциальности →
                </Link>
              </div>

              {/* Response Time */}
              <div className="card p-6">
                <div className="text-3xl mb-3">⏱️</div>
                <h3 className="font-semibold text-text-primary mb-2">
                  Время ответа
                </h3>
                <p className="text-sm text-text-secondary">
                  Мы стараемся отвечать на все обращения в течение 24 часов в рабочие дни. В выходные и праздничные дни время ответа может быть увеличено.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}