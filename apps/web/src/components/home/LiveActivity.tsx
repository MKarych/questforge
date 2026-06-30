'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { apiClient } from '@/lib/api/client';
import { io, Socket } from 'socket.io-client';

interface ActivityEvent {
  id: string;
  type: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface LiveActivityProps {
  enabled: boolean;
}

const ACTIVITY_ICONS: Record<string, string> = {
  GAME_STARTED: '🎮',
  GAME_FINISHED: '🏁',
  TEAM_CREATED: '👥',
  SCENARIO_PUBLISHED: '📝',
  REVIEW_LEFT: '⭐',
  USER_REGISTERED: '👤',
  ACHIEVEMENT_UNLOCKED: '🏆',
};

const DEFAULT_ICON = '🔔';

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'только что';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} мин. назад`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ч. назад`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} д. назад`;
}

function ActivityContent({ enabled }: { enabled: boolean }) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // Загрузка событий через REST API
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: ActivityEvent[] }>('/activity/live?limit=10');
      // TransformInterceptor оборачивает ответ в { success, data, meta },
      // поэтому response.data — это { data: ActivityEvent[] }
      const items = response?.data?.data;
      setActivities(Array.isArray(items) ? items : []);
    } catch {
      // Тихая ошибка — блок не критичен
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    loadEvents();
  }, [enabled, loadEvents]);

  // Подписка на WebSocket
  useEffect(() => {
    if (!enabled) return;

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    const socket = io(`${socketUrl}/realtime`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:activity');
    });

    socket.on('activity:event', (event: ActivityEvent) => {
      setActivities((prev) => [event, ...prev].slice(0, 10));
    });

    return () => {
      socket.emit('leave:activity');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <h2 className="text-lg font-semibold text-text-primary">Прямо сейчас</h2>
      </div>

      {loading && activities.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-lg animate-pulse"
            >
              <div className="w-6 h-6 bg-surface-alt rounded-full" />
              <div className="h-4 bg-surface-alt rounded flex-1" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
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
              <span className="text-lg">
                {ACTIVITY_ICONS[activity.type] || DEFAULT_ICON}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary truncate">
                  {activity.userName}{' '}
                  {activity.type === 'GAME_STARTED' && 'запустил игру'}
                  {activity.type === 'GAME_FINISHED' && 'завершил игру'}
                  {activity.type === 'TEAM_CREATED' && 'создал команду'}
                  {activity.type === 'SCENARIO_PUBLISHED' && 'опубликовал сценарий'}
                  {activity.type === 'REVIEW_LEFT' && 'оставил отзыв'}
                  {activity.type === 'USER_REGISTERED' && 'зарегистрировался'}
                  {activity.type === 'ACHIEVEMENT_UNLOCKED' && 'получил достижение'}
                </p>
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap">
                {formatTimeAgo(activity.createdAt)}
              </span>
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