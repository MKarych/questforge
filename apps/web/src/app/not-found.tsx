'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function NotFoundPage() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Инициализация темы из localStorage
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = systemPrefersDark ? 'dark' : 'light';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    }
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* ===== Фоновый шум ===== */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* ===== Схематичная карта города (SVG) ===== */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 dark:opacity-10"
        style={{ color: 'var(--color-text-muted)' }}>
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full max-w-4xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Сетка улиц */}
          <g stroke="currentColor" strokeWidth="1" opacity="0.5">
            <line x1="50" y1="100" x2="750" y2="100" strokeDasharray="8 4" />
            <line x1="50" y1="200" x2="750" y2="200" />
            <line x1="50" y1="300" x2="750" y2="300" strokeDasharray="4 4" />
            <line x1="50" y1="400" x2="750" y2="400" />
            <line x1="50" y1="500" x2="750" y2="500" strokeDasharray="8 4" />
            <line x1="150" y1="50" x2="150" y2="550" />
            <line x1="300" y1="50" x2="300" y2="550" strokeDasharray="4 4" />
            <line x1="450" y1="50" x2="450" y2="550" />
            <line x1="600" y1="50" x2="600" y2="550" strokeDasharray="8 4" />
          </g>

          {/* Кварталы (здания) */}
          <g fill="currentColor" opacity="0.25">
            <rect x="160" y="110" width="30" height="30" rx="2" />
            <rect x="200" y="110" width="40" height="30" rx="2" />
            <rect x="250" y="110" width="30" height="30" rx="2" />
            <rect x="310" y="110" width="50" height="30" rx="2" />
            <rect x="370" y="110" width="30" height="30" rx="2" />
            <rect x="460" y="110" width="40" height="30" rx="2" />
            <rect x="510" y="110" width="30" height="30" rx="2" />
            <rect x="160" y="210" width="50" height="40" rx="2" />
            <rect x="220" y="210" width="30" height="40" rx="2" />
            <rect x="310" y="210" width="40" height="40" rx="2" />
            <rect x="360" y="210" width="50" height="40" rx="2" />
            <rect x="460" y="210" width="30" height="40" rx="2" />
            <rect x="500" y="210" width="40" height="40" rx="2" />
            <rect x="160" y="410" width="40" height="40" rx="2" />
            <rect x="210" y="410" width="30" height="40" rx="2" />
            <rect x="310" y="410" width="50" height="40" rx="2" />
            <rect x="370" y="410" width="30" height="40" rx="2" />
            <rect x="460" y="410" width="40" height="40" rx="2" />
            <rect x="510" y="410" width="30" height="40" rx="2" />
          </g>

          {/* Парк (зелёная зона) */}
          <g fill="currentColor" opacity="0.15">
            <rect x="160" y="310" width="80" height="80" rx="8" />
            <rect x="460" y="310" width="80" height="80" rx="8" />
          </g>

          {/* Река (диагональная) */}
          <path
            d="M50 250 Q200 200 350 300 Q500 400 750 350"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            opacity="0.2"
          />

          {/* Названия улиц */}
          <g className="text-[8px]" fill="currentColor" opacity="0.4">
            <text x="55" y="95">ул. Приключенческая</text>
            <text x="55" y="195">ул. Квестовая</text>
            <text x="55" y="295">ул. Загадочная</text>
            <text x="55" y="395">пр. Героев</text>
            <text x="55" y="495">ул. Финальная</text>
            <text x="155" y="45">пр. Мира</text>
            <text x="305" y="45">ул. Таинственная</text>
            <text x="455" y="45">бульвар Побед</text>
            <text x="605" y="45">ул. Дальняя</text>
          </g>

          {/* Стрелка компаса на карте */}
          <g transform="translate(700, 80)" fill="currentColor" opacity="0.3">
            <text x="-4" y="-8" className="text-[10px] font-bold">N</text>
            <polygon points="0,-15 4,-5 -4,-5" />
            <polygon points="0,15 4,5 -4,5" opacity="0.5" />
          </g>
        </svg>
      </div>

      {/* ===== Затемнение для читаемости ===== */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, var(--color-background) 100%)',
          opacity: 0.7,
        }}
      />

      {/* ===== Контент ===== */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Крупная надпись 404 */}
        <div className="relative mb-6">
          <h1 className="text-[120px] md:text-[180px] font-bold leading-none tracking-tighter select-none"
            style={{
              background: 'linear-gradient(to bottom, var(--color-primary), transparent)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: 0.3,
            }}>
            404
          </h1>
        </div>

        {/* Пульсирующая точка "потерянный сигнал" */}
        <div className="relative mb-8">
          <div className="w-4 h-4 rounded-full animate-ping absolute inset-0"
            style={{ backgroundColor: 'var(--color-primary)', opacity: 0.3 }} />
          <div className="w-4 h-4 rounded-full relative z-10"
            style={{
              backgroundColor: 'var(--color-primary)',
              boxShadow: '0 0 20px var(--color-primary)',
            }} />
        </div>

        {/* Текст */}
        <p className="text-lg md:text-xl mb-2 max-w-md"
          style={{ color: 'var(--color-text-secondary)' }}>
          Кажется, этой улицы не существует...
        </p>
        <p className="text-base mb-10 max-w-md"
          style={{ color: 'var(--color-text-muted)' }}>
          Похоже, вы заблудились. Такого маршрута нет на карте.
        </p>

        {/* Компас (вращающийся) */}
        <div className={`mb-10 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <svg
            viewBox="0 0 100 100"
            className="w-16 h-16 md:w-20 md:h-20"
            style={{
              color: 'var(--color-text-muted)',
              opacity: 0.5,
              animation: 'spin-compass 8s linear infinite',
            }}
          >
            {/* Внешнее кольцо */}
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
            {/* Деления */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
              <line
                key={angle}
                x1={50 + 38 * Math.cos((angle * Math.PI) / 180)}
                y1={50 + 38 * Math.sin((angle * Math.PI) / 180)}
                x2={50 + 42 * Math.cos((angle * Math.PI) / 180)}
                y2={50 + 42 * Math.sin((angle * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.6"
              />
            ))}
            {/* Стрелка севера (красная/яркая) */}
            <polygon
              points="50,8 55,45 50,40 45,45"
              fill="currentColor"
              opacity="0.8"
            />
            {/* Стрелка юга (тусклая) */}
            <polygon
              points="50,92 55,55 50,60 45,55"
              fill="currentColor"
              opacity="0.3"
            />
            {/* Центральная точка */}
            <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.5" />
          </svg>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
            style={{
              backgroundColor: 'var(--color-primary)',
              boxShadow: '0 4px 20px var(--color-primary)',
            }}
          >
            <span>🧭</span>
            Вернуться на главную
          </Link>
          <Link
            href="/games"
            className="inline-flex items-center gap-2 px-6 py-3 font-medium rounded-xl border transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span>📜</span>
            Посмотреть карту игр
          </Link>
        </div>

        {/* Подпись */}
        <p className="mt-12 text-xs" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>
          Город Приключений • Карта обновляется
        </p>
      </div>

      {/* ===== CSS-анимации ===== */}
      <style jsx>{`
        @keyframes spin-compass {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}