'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getGame, type GameDetails } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGame() {
      try {
        const response = await getGame(gameId);
        setGame(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить игру';
        setError(message);
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    }

    if (gameId) {
      loadGame();
    }
  }, [gameId, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-success/10 text-success';
      case 'STARTED':
        return 'bg-warning/10 text-warning';
      case 'IN_PROGRESS':
        return 'bg-warning/10 text-warning';
      case 'FINISHED':
        return 'bg-surface-elevated text-text-muted';
      default:
        return 'bg-surface-elevated text-text-muted';
    }
  };

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
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">{error || 'Игра не найдена'}</p>
            <Link href="/organizer/games" className="btn-primary">
              ← Назад к играм
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
        <div className="mb-6">
          <Link href="/organizer/games" className="text-text-secondary hover:text-text-primary text-sm">
            ← Назад к играм
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold text-text-primary">{game.title}</h1>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(game.status)}`}>
                  {game.status}
                </span>
              </div>
              
              <p className="text-text-secondary mb-6">{game.description}</p>
              
              {game.imageUrl && (
                <div className="mb-6">
                  <img
                    src={game.imageUrl}
                    alt={game.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-text-secondary">Город</span>
                  <p className="text-text-primary font-medium">{game.city}</p>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Дата</span>
                  <p className="text-text-primary font-medium">
                    {new Date(game.date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Длительность</span>
                  <p className="text-text-primary font-medium">{game.duration} мин</p>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Цена</span>
                  <p className="text-text-primary font-medium">{game.price} ₽</p>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Макс. команд</span>
                  <p className="text-text-primary font-medium">{game.maxTeams}</p>
                </div>
              </div>
            </div>

            {/* Scenario */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Сценарий</h2>
              {game.scenario ? (
                <div className="space-y-2">
                  <p className="text-text-primary font-medium">{game.scenario.name}</p>
                  <p className="text-sm text-text-secondary">Версия: v{game.scenario.version}</p>
                </div>
              ) : (
                <p className="text-text-secondary">Сценарий не привязан</p>
              )}
            </div>

            {/* Reviews */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Отзывы ({game.reviewsCount})</h2>
              {game.reviews.length === 0 ? (
                <p className="text-text-secondary">Отзывов пока нет</p>
              ) : (
                <div className="space-y-4">
                  {game.reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-primary font-medium">{review.user.name}</span>
                        <span className="text-sm text-text-secondary">
                          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <span key={i} className="text-warning">★</span>
                        ))}
                      </div>
                      {review.text && <p className="text-text-secondary text-sm">{review.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Статистика</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Команд</span>
                  <span className="text-text-primary font-medium">{game.teamsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Средний рейтинг</span>
                  <span className="text-text-primary font-medium">
                    {game.averageRating > 0 ? `${game.averageRating} ★` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Создана</span>
                  <span className="text-text-primary font-medium">
                    {new Date(game.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                {game.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Опубликована</span>
                    <span className="text-text-primary font-medium">
                      {new Date(game.publishedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Share Link */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Ссылка на игру</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/game/${game.shareLink}`}
                  readOnly
                  className="input-field flex-1 text-sm"
                />
                <button
                  className="btn-secondary text-sm px-3"
                  onClick={() => {
                    const input = document.querySelector('input[readOnly]') as HTMLInputElement;
                    input?.select();
                    document.execCommand('copy');
                  }}
                >
                  Копировать
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Действия</h2>
              <div className="flex flex-col gap-2">
                <Link href={`/organizer/games/${gameId}/edit`} className="btn-secondary text-center">
                  Редактировать
                </Link>
                {game.status === 'CREATED' && (
                  <button
                    className="btn-primary text-center"
                    disabled
                    title="В разработке"
                  >
                    Опубликовать
                  </button>
                )}
                <button
                  className="btn-secondary text-center text-error hover:border-error"
                  disabled
                  title="В разработке"
                >
                  Удалить
                </button>
              </div>
            </div>

            {/* Organizer */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Организатор</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {game.organizer?.avatarUrl ? (
                    <img
                      src={game.organizer.avatarUrl}
                      alt={game.organizer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-primary">
                      {game.organizer?.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-text-primary font-medium">{game.organizer?.name}</p>
                  <p className="text-xs text-text-secondary">Организатор</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
