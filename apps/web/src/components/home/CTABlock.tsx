'use client';

import Link from 'next/link';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function CTABlock() {
  return (
    <ErrorBoundary blockName="CTA">
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 md:p-12 text-center">
          <div className="relative z-10">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Готов к приключениям?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto">
              Присоединяйтесь к тысячам игроков и создавайте незабываемые воспоминания
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/games" className="btn-primary text-lg px-8 py-3">
                Выбрать игру
              </Link>
              <Link href="/organizer" className="btn-secondary text-lg px-8 py-3">
                Создать свою
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ErrorBoundary>
  );
}