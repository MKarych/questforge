'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type CookieCategory = 'necessary' | 'analytics' | 'marketing';

interface CookieConsent {
  necessary: true;  // Всегда включено
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'cookie_consent_v1';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!saved) {
      // Показываем баннер через небольшую задержку для плавности
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const consent: CookieConsent = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setShowBanner(false);
  };

  const acceptSelected = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    setShowBanner(false);
  };

  const rejectAll = () => {
    const consent: CookieConsent = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4">
      {/* Затемнение фона (только когда открыты детали) */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowDetails(false)}
        />
      )}

      <div className={`relative mx-auto max-w-2xl transition-all duration-300 ${
        showDetails ? 'scale-100' : 'scale-100'
      }`}>
        <div className="bg-surface border border-border rounded-2xl shadow-2xl p-5 md:p-6">
          {!showDetails ? (
            /* ===== Упрощённый вид ===== */
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🍪</span>
                  <span className="font-semibold text-text-primary">Cookie-файлы</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Мы используем cookie для авторизации, аналитики и улучшения работы платформы.{' '}
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-primary hover:text-primary-hover underline underline-offset-2"
                  >
                    Настроить
                  </button>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Отклонить
                </button>
                <button
                  onClick={acceptAll}
                  className="px-5 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors"
                >
                  Принять все
                </button>
              </div>
            </div>
          ) : (
            /* ===== Детальные настройки ===== */
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍪</span>
                  <h3 className="text-lg font-semibold text-text-primary">Настройка cookie-файлов</h3>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-text-secondary mb-5">
                Мы используем cookie-файлы для обеспечения работы платформы, сбора статистики и персонализации. Вы можете выбрать, какие категории разрешить.
              </p>

              {/* Necessary — всегда включено */}
              <div className="flex items-start justify-between p-3 rounded-lg bg-surface-elevated/50 mb-2">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm">🔒 Технические (обязательные)</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">Всегда active</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Необходимы для авторизации, безопасности и базовой функциональности платформы. Не могут быть отключены.
                  </p>
                </div>
                <div className="w-10 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>

              {/* Analytics */}
              <label className="flex items-start justify-between p-3 rounded-lg hover:bg-surface-elevated/30 cursor-pointer mb-2 transition-colors">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm">📊 Аналитические</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Помогают нам понимать, как используется платформа, чтобы улучшать её. Включают Яндекс.Метрику и Google Analytics.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="w-5 h-5 rounded border-surface-elevated bg-surface text-primary focus:ring-primary cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              {/* Marketing */}
              <label className="flex items-start justify-between p-3 rounded-lg hover:bg-surface-elevated/30 cursor-pointer mb-5 transition-colors">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm">🎯 Маркетинговые</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Используются для показа персонализированных предложений и рекламы. Включают пиксели соцсетей.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="w-5 h-5 rounded border-surface-elevated bg-surface text-primary focus:ring-primary cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              {/* Ссылка на политику */}
              <p className="text-xs text-text-muted mb-4">
                Подробнее — в{' '}
                <Link href="/privacy" className="text-primary hover:text-primary-hover underline underline-offset-2">
                  Политике конфиденциальности
                </Link>
              </p>

              {/* Кнопки */}
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors order-3 sm:order-1"
                >
                  Отклонить все
                </button>
                <button
                  onClick={acceptSelected}
                  className="px-5 py-2 text-sm font-medium bg-surface hover:bg-surface-elevated text-text-primary border border-border rounded-xl transition-colors order-2"
                >
                  Сохранить выбранные
                </button>
                <button
                  onClick={acceptAll}
                  className="px-5 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors order-1 sm:order-3"
                >
                  Принять все
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}