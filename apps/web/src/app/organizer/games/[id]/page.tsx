'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getGame, publishGame, removeGame,
  openRegistration, closeRegistration, moveToLobby,
  startGame, finishGame, cancelGame,
  getGameRegistrations, type GameDetails,
} from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TeamStatus {
  teamId: string;
  team: { id: string; name: string; slug: string; avatar: string | null };
  status: string;
  readyAt: string | null;
  registeredAt: string;
}

interface TimerInfo {
  canStart: boolean;
  timeUntilStart: number;
  status: string;
  startTime: string;
  now: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликована',
  REGISTRATION_OPEN: 'Регистрация открыта',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  LOBBY: 'Ожидание старта',
  RUNNING: 'Идёт игра',
  FINISHED: 'Завершена',
  CANCELLED: 'Отменена',
  ARCHIVED: 'В архиве',
  HIDDEN: 'Скрыта',
  BLOCKED: 'Заблокирована',
  RESCHEDULED: 'Перенесена',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-surface-elevated text-text-muted',
  PUBLISHED: 'bg-success/10 text-success',
  REGISTRATION_OPEN: 'bg-success/10 text-success',
  REGISTRATION_CLOSED: 'bg-info/10 text-info',
  LOBBY: 'bg-warning/10 text-warning',
  RUNNING: 'bg-warning/10 text-warning',
  FINISHED: 'bg-surface-elevated text-text-muted',
  CANCELLED: 'bg-error/10 text-error',
  ARCHIVED: 'bg-surface-elevated text-text-muted',
  HIDDEN: 'bg-surface-elevated text-text-muted',
  BLOCKED: 'bg-error/10 text-error',
  RESCHEDULED: 'bg-warning/10 text-warning',
};

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<GameDetails | null>(null);
  const [teams, setTeams] = useState<TeamStatus[]>([]);
  const [timer, setTimer] = useState<TimerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
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
  }, [gameId, router]);

  const loadTeams = useCallback(async () => {
    if (!gameId) return;
    try {
      const response = await getGameRegistrations(gameId);
      if (response.data && Array.isArray(response.data)) {
        setTeams(response.data);
      }
    } catch {
      // ignore
    }
  }, [gameId]);

  const loadTimer = useCallback(async () => {
    if (!gameId) return;
    try {
      const response = await fetch(`/api/games/${gameId}/timer`);
      if (response.ok) {
        const data = await response.json();
        setTimer(data);
      }
    } catch {
      // ignore
    }
  }, [gameId]);

  useEffect(() => {
    if (gameId) {
      loadGame();
    }
  }, [gameId, loadGame]);

  // Загружаем команды и таймер, если нужно
  useEffect(() => {
    if (game && ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LOBBY', 'RUNNING'].includes(game.status)) {
      loadTeams();
      if (game.status === 'LOBBY') {
        loadTimer();
      }
    }
  }, [game, loadTeams, loadTimer]);

  // Авто-обновление команд и таймера
  useEffect(() => {
    if (!game || !['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LOBBY', 'RUNNING'].includes(game.status)) return;

    const interval = setInterval(() => {
      loadTeams();
      if (game.status === 'LOBBY') {
        loadTimer();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [game, loadTeams, loadTimer]);

  const handleAction = async (action: string, actionFn: () => Promise<any>) => {
    if (!game) return;
    setActionLoading(action);
    setError(null);
    try {
      const result = await actionFn();
      if (result?.data) {
        setGame(result.data);
      }
      await loadGame();
      await loadTeams();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Ошибка: ${action}`;
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

  const readyCount = teams.filter((t) => t.status === 'READY').length;
  const totalCount = teams.length;

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
            {/* Game Header */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{game.title}</h1>
                  <p className="text-sm text-text-secondary mt-1">
                    Ссылка: /play/{game.shareLink}
                  </p>
                </div>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[game.status] || 'bg-surface-elevated text-text-muted'}`}>
                  {STATUS_LABELS[game.status] || game.status}
                </span>
              </div>
              
              <p className="text-text-secondary mb-6">{game.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

            {/* Teams List */}
            {['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LOBBY', 'RUNNING'].includes(game.status) && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    📋 Команды ({totalCount})
                  </h2>
                  {game.status === 'LOBBY' && (
                    <span className="text-sm text-text-secondary">
                      Готовы: {readyCount}/{totalCount}
                    </span>
                  )}
                </div>

                {teams.length === 0 ? (
                  <p className="text-text-secondary text-center py-4">
                    Пока нет зарегистрированных команд
                  </p>
                ) : (
                  <div className="space-y-3">
                    {teams.map((t) => (
                      <div
                        key={t.teamId}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                            {t.team.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-text-primary font-medium">{t.team.name}</span>
                            <div className="text-xs text-text-muted">
                              Зарегистрированы: {new Date(t.registeredAt).toLocaleString('ru-RU')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {t.readyAt && (
                            <span className="text-xs text-text-muted">
                              Готовы с: {new Date(t.readyAt).toLocaleTimeString('ru-RU')}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            t.status === 'READY' ? 'bg-success/10 text-success' : 'bg-surface text-text-muted'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'READY' ? 'bg-success' : 'bg-text-muted'}`} />
                            {t.status === 'READY' ? 'Готовы' : 'Ожидание'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Timer for LOBBY */}
            {game.status === 'LOBBY' && timer && (
              <div className="card">
                <h2 className="text-lg font-semibold text-text-primary mb-4">⏱ Таймер до старта</h2>
                <div className="text-center p-4 rounded-lg bg-surface-elevated">
                  <div className={`text-4xl font-bold font-mono ${timer.canStart ? 'text-success' : 'text-text-primary'}`}>
                    {timer.canStart ? '🚀 МОЖНО СТАРТОВАТЬ!' : formatTime(timer.timeUntilStart)}
                  </div>
                  <div className="text-sm text-text-secondary mt-2">
                    Старт: {new Date(timer.startTime).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>
            )}

            {/* Scenario */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Сценарий</h2>
                {game.scenario ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Сценарий привязан
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    Сценарий не привязан
                  </span>
                )}
              </div>
              {game.scenario ? (
                <div className="space-y-2">
                  <p className="text-text-primary font-medium">{game.scenario.name}</p>
                  <p className="text-sm text-text-secondary">Версия: v{game.scenario.version}</p>
                </div>
              ) : (
                <div>
                  <p className="text-text-secondary mb-3">Сценарий не привязан</p>
                  <Link
                    href={`/organizer/games/${game.id}/edit`}
                    className="text-primary hover:text-primary-hover text-sm font-medium"
                  >
                    Привязать сценарий →
                  </Link>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Отзывы ({game.reviewsCount})</h2>
              {!game.reviews || game.reviews.length === 0 ? (
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
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/play/${game.shareLink}`}
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

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Действия</h2>
              <div className="flex flex-col gap-2">
                {/* Редактировать — всегда доступно, кроме RUNNING/FINISHED */}
                {!['RUNNING', 'FINISHED', 'ARCHIVED', 'CANCELLED'].includes(game.status) && (
                  <Link href={`/organizer/games/${gameId}/edit`} className="btn-secondary text-center">
                    ✏️ Редактировать
                  </Link>
                )}

                {/* DRAFT → PUBLISHED */}
                {game.status === 'DRAFT' && (
                  <button
                    className="btn-primary text-center"
                    onClick={() => handleAction('publish', () => publishGame(gameId))}
                    disabled={actionLoading === 'publish'}
                  >
                    {actionLoading === 'publish' ? '...' : '📢 Опубликовать'}
                  </button>
                )}

                {/* PUBLISHED → REGISTRATION_OPEN */}
                {game.status === 'PUBLISHED' && (
                  <button
                    className="btn-primary text-center"
                    onClick={() => handleAction('openRegistration', () => openRegistration(gameId))}
                    disabled={actionLoading === 'openRegistration'}
                  >
                    {actionLoading === 'openRegistration' ? '...' : '📝 Открыть регистрацию'}
                  </button>
                )}

                {/* REGISTRATION_OPEN → REGISTRATION_CLOSED */}
                {game.status === 'REGISTRATION_OPEN' && (
                  <button
                    className="btn-primary text-center"
                    onClick={() => handleAction('closeRegistration', () => closeRegistration(gameId))}
                    disabled={actionLoading === 'closeRegistration'}
                  >
                    {actionLoading === 'closeRegistration' ? '...' : '🔒 Закрыть регистрацию'}
                  </button>
                )}

                {/* REGISTRATION_CLOSED → LOBBY */}
                {game.status === 'REGISTRATION_CLOSED' && (
                  <button
                    className="btn-primary text-center"
                    onClick={() => handleAction('moveToLobby', () => moveToLobby(gameId))}
                    disabled={actionLoading === 'moveToLobby'}
                  >
                    {actionLoading === 'moveToLobby' ? '...' : '🔄 Перейти в лобби'}
                  </button>
                )}

                {/* LOBBY → RUNNING */}
                {game.status === 'LOBBY' && (
                  <button
                    className="btn-success text-center"
                    onClick={() => handleAction('startGame', () => startGame(gameId))}
                    disabled={actionLoading === 'startGame'}
                  >
                    {actionLoading === 'startGame' ? '...' : '🚀 Запустить игру'}
                  </button>
                )}

                {/* RUNNING → FINISHED */}
                {game.status === 'RUNNING' && (
                  <>
                    <Link
                      href={`/organizer/games/${gameId}/running`}
                      className="btn-primary text-center"
                    >
                      📊 Управление игрой
                    </Link>
                    <button
                      className="btn-warning text-center"
                      onClick={() => {
                        if (confirm('Вы уверены, что хотите завершить игру?')) {
                          handleAction('finishGame', () => finishGame(gameId));
                        }
                      }}
                      disabled={actionLoading === 'finishGame'}
                    >
                      {actionLoading === 'finishGame' ? '...' : '⏹ Завершить игру'}
                    </button>
                  </>
                )}

                {/* Отмена — доступна из многих статусов */}
                {['PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LOBBY'].includes(game.status) && (
                  <button
                    className="btn-secondary text-center text-error hover:border-error"
                    onClick={() => {
                      if (confirm('Вы уверены, что хотите отменить игру? Команды получат уведомление.')) {
                        handleAction('cancelGame', () => cancelGame(gameId));
                      }
                    }}
                    disabled={actionLoading === 'cancelGame'}
                  >
                    {actionLoading === 'cancelGame' ? '...' : '❌ Отменить игру'}
                  </button>
                )}

                {/* Удаление — только для DRAFT */}
                {game.status === 'DRAFT' && (
                  <button
                    className="btn-secondary text-center text-error hover:border-error"
                    onClick={() => {
                      if (confirm('Вы уверены, что хотите удалить игру? Это действие нельзя отменить.')) {
                        handleAction('delete', () => removeGame(gameId));
                        router.push('/organizer/games');
                      }
                    }}
                    disabled={actionLoading === 'delete'}
                  >
                    {actionLoading === 'delete' ? '...' : '🗑 Удалить'}
                  </button>
                )}
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
