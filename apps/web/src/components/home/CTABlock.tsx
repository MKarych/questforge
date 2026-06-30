'use client';

import Link from 'next/link';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function CTABlock() {
  return (
    <ErrorBoundary blockName="CTA">
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8 md:p-12 text-center">
          {/* Лёгкий градиентный акцент */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent" />

          <div className="relative z-10">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Готов к приключениям?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto">
              Присоединяйтесь к тысячам игроков и создавайте незабываемые воспоминания
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/games"
                className="
                  inline-flex items-center justify-center gap-2
                  text-lg px-8 py-3.5 sm:px-10 sm:py-4
                  font-semibold rounded-xl
                  transition-all duration-200
                  bg-primary hover:bg-primary-hover
                  text-white
                  shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30
                  hover:-translate-y-0.5
                  active:translate-y-0
                "
              >
                Выбрать игру
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/organizer"
                className="
                  inline-flex items-center justify-center gap-2
                  text-lg px-8 py-3.5 sm:px-10 sm:py-4
                  font-semibold rounded-xl
                  transition-all duration-200
                  bg-surface/80 backdrop-blur-sm
                  hover:bg-surface-elevated
                  text-text-primary
                  border-2 border-border hover:border-primary/40
                  shadow-md hover:shadow-lg
                  hover:-translate-y-0.5
                  active:translate-y-0
                "
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Создать свою
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ErrorBoundary>
  );
}