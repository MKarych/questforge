'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { getActivityFeed } from '@/lib/api/client';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  metadata?: any;
}

const ACTIVITY_ICONS: Record<string, string> = {
  game_created: '🎮',
  game_played: '✅',
  game_reviewed: '⭐',
  scenario_created: '📝',
  scenario_purchased: '🛒',
  achievement_unlocked: '🏆',
  team_created: '👥',
  team_joined: '🤝',
  friend_added: '👋',
  profile_updated: '✏️',
};

const ACTIVITY_LABELS: Record<string, string> = {
  game_created: 'Создал игру',
  game_played: 'Прошёл игру',
  game_reviewed: 'Оставил отзыв',
  scenario_created: 'Создал сценарий',
  scenario_purchased: 'Приобрёл сценарий',
  achievement_unlocked: 'Получил достижение',
  team_created: 'Создал команду',
  team_joined: 'Присоединился к команде',
  friend_added: 'Добавил друга',
  profile_updated: 'Обновил профиль',
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadActivity = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityFeed('me', limit, pageNum * limit);
      const data = res.data?.data || res.data || [];
      if (pageNum === 0) {
        setActivities(data);
      } else {
        setActivities((prev) => [...prev, ...data]);
      }
      setTotal(res.data?.meta?.total || data.length);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки активности');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity(0);
  }, [loadActivity]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadActivity(nextPage);
  };

  const hasMore = activities.length < total;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/profile" className="hover:text-primary">Профиль</Link>
          <span>/</span>
          <span className="text-text-primary">Активность</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-6">Активность</h1>

        {loading && activities.length === 0 ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={() => loadActivity(0)} className="text-primary hover:underline text-sm">
              Попробовать снова
            </button>
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Активность пуста"
            description="Здесь будет отображаться ваша активность на платформе"
          />
        ) : (
          <div>
            <div className="space-y-2">
              {activities.map((activity) => (
                <div key={activity.id} className="card p-4 flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">
                    {ACTIVITY_ICONS[activity.type] || '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs px-1.5 py-0.5 bg-surface-secondary rounded text-text-secondary">
                        {ACTIVITY_LABELS[activity.type] || activity.type}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary">{activity.description}</p>
                    <p className="text-xs text-text-secondary/60 mt-1">
                      {new Date(activity.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 border border-border text-text-secondary rounded-lg text-sm hover:bg-surface-secondary transition-colors disabled:opacity-50"
                >
                  {loading ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}