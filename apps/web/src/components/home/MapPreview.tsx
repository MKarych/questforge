'use client';

import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface MapPreviewProps {
  enabled: boolean;
}

function MapContent() {
  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-6">
        📍 Игры в вашем городе
      </h2>

      <div className="card flex items-center justify-center py-16 bg-surface-elevated/50">
        <div className="text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-sm text-text-secondary mb-2">Карта городов</p>
          <p className="text-xs text-text-muted">Скоро здесь появится карта с играми</p>
        </div>
      </div>
    </section>
  );
}

export default function MapPreview({ enabled }: MapPreviewProps) {
  if (!enabled) return null;

  return (
    <ErrorBoundary blockName="Карта">
      <MapContent />
    </ErrorBoundary>
  );
}