'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { FeatureFlags } from '@/lib/api/client';

interface FooterProps {
  featureFlags?: FeatureFlags;
  stats?: {
    games: number;
    teams: number;
    players: number;
    cities: number;
    organizers: number;
  } | null;
}

export default function Footer({ featureFlags, stats }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: отправка email в список рассылки
    setSubscribed(true);
    setEmail('');
  };

  const defaultStats = stats || {
    games: 120,
    teams: 430,
    players: 5800,
    cities: 15,
    organizers: 120,
  };

  return (
    <footer className="border-t border-border bg-surface mt-20" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        {/* 4 колонки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Колонка: О проекте */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/logo/logo.png"
                alt="Город Приключений"
                width={28}
                height={28}
                className="h-7 w-auto"
              />
              <span className="text-base font-bold text-text-primary">
                Город Приключений
              </span>
            </div>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              Платформа для городских игр нового поколения. Создавай и проходи захватывающие квесты в своём городе.
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Контакты
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Пользовательское соглашение
                </Link>
              </li>
            </ul>
          </div>

          {/* Колонка: Помощь */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Помощь
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Поддержка
                </Link>
              </li>
              <li>
                <Link href="/organizer" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Как создать игру
                </Link>
              </li>
              <li>
                <Link href="/become-organizer" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Как стать организатором
                </Link>
              </li>
            </ul>
          </div>

          {/* Колонка: Сообщество */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Сообщество
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://t.me/adventureengine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
                >
                  <span className="text-base">✈️</span>
                  Telegram
                </a>
              </li>
              <li>
                <a
                  href="https://vk.com/adventureengine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
                >
                  <span className="text-base">📱</span>
                  VK
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com/@adventureengine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
                >
                  <span className="text-base">▶️</span>
                  YouTube
                </a>
              </li>
            </ul>

            {/* Статистика */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
                Статистика
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-elevated rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-primary">{defaultStats.games}+</div>
                  <div className="text-xs text-text-muted">игр</div>
                </div>
                <div className="bg-surface-elevated rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-primary">{defaultStats.teams}+</div>
                  <div className="text-xs text-text-muted">команд</div>
                </div>
                <div className="bg-surface-elevated rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-primary">{defaultStats.players}+</div>
                  <div className="text-xs text-text-muted">игроков</div>
                </div>
                <div className="bg-surface-elevated rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-primary">{defaultStats.cities}+</div>
                  <div className="text-xs text-text-muted">городов</div>
                </div>
              </div>
            </div>
          </div>

          {/* Колонка: Newsletter + Feature Flags */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Новости
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Подпишитесь на новости и узнавайте о новых играх первыми
            </p>

            {subscribed ? (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                <p className="text-sm text-success font-medium">✅ Вы подписаны!</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  aria-label="Email для подписки"
                  required
                />
                <button
                  type="submit"
                  className="btn-primary text-sm py-2 px-4 shrink-0"
                >
                  Подписаться
                </button>
              </form>
            )}

            {/* Download App (Feature Flag) */}
            {featureFlags?.downloadApp && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
                  Скачать приложение
                </h3>
                <div className="flex flex-col gap-2">
                  <button className="flex items-center gap-2 bg-surface-elevated hover:bg-surface-elevated/80 rounded-lg px-4 py-2.5 transition-colors text-left">
                    <span className="text-lg">📱</span>
                    <div>
                      <div className="text-xs text-text-muted">Скоро</div>
                      <div className="text-sm text-text-primary font-medium">Google Play</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-2 bg-surface-elevated hover:bg-surface-elevated/80 rounded-lg px-4 py-2.5 transition-colors text-left">
                    <span className="text-lg">🍎</span>
                    <div>
                      <div className="text-xs text-text-muted">Скоро</div>
                      <div className="text-sm text-text-primary font-medium">App Store</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Partners (Feature Flag) */}
            {featureFlags?.partners && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
                  Партнёры
                </h3>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-surface-elevated rounded-lg px-4 py-2 text-sm text-text-muted">
                    Партнёр 1
                  </div>
                  <div className="bg-surface-elevated rounded-lg px-4 py-2 text-sm text-text-muted">
                    Партнёр 2
                  </div>
                </div>
              </div>
            )}

            {/* Press (Feature Flag) */}
            {featureFlags?.press && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
                  О нас пишут
                </h3>
                <div className="bg-surface-elevated rounded-lg p-3">
                  <p className="text-sm text-text-muted italic">
                    "Город Приключений — лучшая платформа для городских квестов"
                  </p>
                  <p className="text-xs text-text-muted mt-1">— Источник</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cookie Banner */}
        <div className="border-t border-border pt-6 mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              Мы используем cookie-файлы для улучшения работы платформы. Продолжая использование, вы соглашаетесь с{' '}
              <Link href="/privacy" className="text-primary hover:text-primary-hover underline">
                политикой конфиденциальности
              </Link>.
            </p>
            <button className="btn-primary text-xs py-1.5 px-4 shrink-0">
              Принять
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} Город Приключений. Все права защищены.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-xs text-text-muted hover:text-text-primary transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="/terms" className="text-xs text-text-muted hover:text-text-primary transition-colors">
                Пользовательское соглашение
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}