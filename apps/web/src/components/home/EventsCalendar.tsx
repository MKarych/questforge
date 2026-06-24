'use client';

import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function EventsCalendar() {
  return (
    <ErrorBoundary blockName="Календарь">
      <section className="mb-12">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-6">
          📅 Игры на этой неделе
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-sm text-text-muted mb-1">Сегодня</div>
            <div className="text-2xl font-bold text-primary">2</div>
            <div className="text-xs text-text-muted">игры</div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-text-muted mb-1">Завтра</div>
            <div className="text-2xl font-bold text-primary">1</div>
            <div className="text-xs text-text-muted">игра</div>
          </div>
          <div className="card text-center">
            <div className="text-sm text-text-muted mb-1">На выходных</div>
            <div className="text-2xl font-bold text-primary">5</div>
            <div className="text-xs text-text-muted">игр</div>
          </div>
        </div>
      </section>
    </ErrorBoundary>
  );
}