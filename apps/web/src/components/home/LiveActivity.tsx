'use client';

import { useState } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface Activity {
  id: string;
  type: 'register' | 'win' | 'publish' | 'review';
  text: string;
  timestamp: string;
}

// Мок-данные (пока без API)
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'register',
    text: 'Игрок Алексей зарегистрировался',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'win',
    text: 'Команда Победа выиграла игру',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'publish',
    text: 'Новый сценарий опубликован',
    timestamp: new Date().toISOString(),
  },
];

interface LiveActivityProps {
  enabled: boolean;
}

function ActivityContent({ enabled }: { enabled: boolean }) {
  const [activities] = useState<Activity[]>(MOCK_ACTIVITIES);

  if (!enabled) return null;

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'register': return '👤';
      case 'win': return '🏆';
      case 'publish': return '📝';
      case 'review': return '⭐';
    }
  };

  return (
    <section className="mb-16">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <h2 className="text-lg font-semibold text-text-primary">Прямо сейчас</h2>
      </div>

      {activities.length === 0 ? (
        <div className="card text-center py-6">
          <p className="text-sm text-text-muted">Нет активности</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-lg"
            >
              <span className="text-lg">{getIcon(activity.type)}</span>
              <p className="text-sm text-text-secondary">{activity.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function LiveActivity(props: LiveActivityProps) {
  return (
    <ErrorBoundary blockName="Активность">
      <ActivityContent enabled={props.enabled} />
    </ErrorBoundary>
  );
}