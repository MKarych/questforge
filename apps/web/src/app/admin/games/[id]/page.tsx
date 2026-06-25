'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, getProfile, GameDetails } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminNav from '@/components/admin/AdminNav';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликована',
  REGISTRATION_OPEN: 'Регистрация открыта',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  LOBBY: 'Лобби',
  RUNNING: 'Идёт',
  FINISHED: 'Завершена',
  ARCHIVED: 'Архив',
  CANCELLED: 'Отменена',
  RESCHEDULED: 'Перенесена',
  HIDDEN: '🔇 Скрыта',
  BLOCKED: '🚫 Заблокирована',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-400',
  PUBLISHED: 'bg-green-500/20 text-green-400',
  REGISTRATION_OPEN: 'bg-blue-500/20 text-blue-400',
  REGISTRATION_CLOSED: 'bg-yellow-500/20 text-yellow-400',
  LOBBY: 'bg-purple-500/20 text-purple-400',
  RUNNING: 'bg-emerald-500/20 text-emerald-400',
  FINISHED: 'bg-slate-500/20 text-slate-400',
  ARCHIVED: 'bg-gray-500/20 text-gray-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
  RESCHEDULED: 'bg-orange-500/20 text-orange-400',
  HIDDEN: 'bg-yellow-500/20 text-yellow-400',
  BLOCKED: 'bg-red-500/20 text-red-400',
};

export default function AdminGameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const profileResponse = await getProfile();
        const role = profileResponse.data.role;
        setUserRole(role);
        if (role !== 'ADMIN' && role !== 'MODERATOR') {
          router.push('/');
          return;
        }

        const gameId = params.id as string;
        const response = await apiClient.getGame(gameId);
        setGame(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <AdminNav userRole={userRole} />
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Ошибка</h2>
            <p className="text-text-secondary">{error || 'Игра не найдена'}</p>
            <Link href="/admin/games" className="btn-primary mt-4 inline-block">
              ← Назад к списку
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <AdminNav userRole={userRole} />

        <div className="mb-6">
          <Link
            href="/admin/games"
            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            ← Назад к списку игр
          </Link>
        </div>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-text-primary truncate">
                  {game.title}
                </h1>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[game.status] || 'bg-gray-500/20 text-gray-400'}`}>
                  {STATUS_LABELS[game.status] || game.status}
                </span>
              </div>
              <p className="text-text-secondary">
                {game.description || 'Нет описания'}
              </p>
            </div>
          </div>

          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="p-3 rounded-lg bg-bg-secondary/50">
              <div className="text-xs text-text-secondary mb-1">📍 Город</div>
              <div className="text-sm font-medium">{game.city}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-secondary/50">
              <div className="text-xs text-text-secondary mb-1">📅 Дата</div>
              <div className="text-sm font-medium">
                {new Date(game.date).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-bg-secondary/50">
              <div className="text-xs text-text-secondary mb-1">⏱️ Длительность</div>
              <div className="text-sm font-medium">{game.duration} мин</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-secondary/50">
              <div className="text-xs text-text-secondary mb-1">💰 Цена</div>
              <div className="text-sm font-medium">{game.price > 0 ? `${game.price} ₽` : 'Бесплатно'}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-secondary/50">
              <div className="text-xs text-text-secondary mb-1">👥 Команды</div>
              <div className="text-sm font-medium">{game.teamsCount} / {game.maxTeams}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-secondary/50">
              <div className="text-xs text-text-secondary mb-1">⭐ Рейтинг</div>
              <div className="text-sm font-medium">{game.averageRating} ({game.reviewsCount} отзывов)</div>
            </div>
          </div>
        </div>

        {/* Организатор и сценарий */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">👤 Организатор</h2>
            <div className="flex items-center gap-3">
              {game.organizer.avatarUrl ? (
                <img
                  src={game.organizer.avatarUrl}
                  alt={game.organizer.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center text-lg">
                  {game.organizer.name[0]}
                </div>
              )}
              <div>
                <div className="font-medium text-text-primary">{game.organizer.name}</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">📜 Сценарий</h2>
            {game.scenario ? (
              <div>
                <div className="font-medium text-text-primary">{game.scenario.name}</div>
                <div className="text-sm text-text-secondary mt-1">v{game.scenario.version}</div>
              </div>
            ) : (
              <div className="text-text-secondary">Сценарий не привязан</div>
            )}
          </div>
        </div>

        {/* Даты */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">📋 Даты</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-text-secondary mb-1">Создана</div>
              <div className="text-sm font-medium">
                {new Date(game.createdAt).toLocaleString('ru-RU')}
              </div>
            </div>
            {game.publishedAt && (
              <div>
                <div className="text-xs text-text-secondary mb-1">Опубликована</div>
                <div className="text-sm font-medium">
                  {new Date(game.publishedAt).toLocaleString('ru-RU')}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-text-secondary mb-1">Обновлена</div>
              <div className="text-sm font-medium">
                {new Date(game.updatedAt).toLocaleString('ru-RU')}
              </div>
            </div>
          </div>
        </div>

        {/* Отзывы */}
        {game.reviews && game.reviews.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">💬 Отзывы ({game.reviewsCount})</h2>
            <div className="space-y-3">
              {game.reviews.map((review) => (
                <div key={review.id} className="p-3 rounded-lg bg-bg-secondary/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-text-primary text-sm">
                      {review.user.name}
                    </span>
                    <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}</span>
                  </div>
                  {review.text && (
                    <p className="text-text-secondary text-sm">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}