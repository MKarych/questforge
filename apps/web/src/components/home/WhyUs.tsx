'use client';

import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function WhyUs() {
  const items = [
    { icon: '⭐', value: '4.9', label: 'Средний рейтинг' },
    { icon: '📊', value: '98%', label: 'игроков рекомендуют' },
    { icon: '🏆', value: '120+', label: 'организаторов' },
    { icon: '👥', value: '10 000+', label: 'игроков' },
  ];

  return (
    <ErrorBoundary blockName="WhyUs">
      <section className="mb-12">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-6 text-center">
          Почему выбирают нас
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.label} className="card text-center py-6">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-2xl font-bold text-primary mb-1">{item.value}</div>
              <div className="text-sm text-text-muted">{item.label}</div>
            </div>
          ))}
        </div>
      </section>
    </ErrorBoundary>
  );
}