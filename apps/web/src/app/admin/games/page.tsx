'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminNav from '@/components/admin/AdminNav';

interface AdminGame {
  id: string;
  title: string;
  description: string | null;
  city: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  maxTeams: number;
  status: string;
  moderationComment: string | null;
  publishedAt: string | null;
  createdAt: string;
  organizer: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  scenario: {
    id: string;
    name: string;
  } | null;
  _count: {
    registrations: number;
    gameTeams: number;
    reviews: number;
  };
}

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

export default function AdminGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<AdminGame[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirm modals
  const [confirmModal, setConfirmModal] = useState<{
    type: 'hide' | 'unhide' | 'block' | 'delete';
    gameId: string;
    gameTitle: string;
  } | null>(null);
  const [moderationComment, setModerationComment] = useState('');

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

        await loadGames();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const loadGames = async (status?: string, search?: string) => {
    try {
      const response = await apiClient.getAdminGames({
        status: status || undefined,
        search: search || undefined,
        limit: 100,
      });
      setGames(response.data.data);
      setTotal(response.data.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  };

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    loadGames(newStatus, searchQuery);
  };

  const handleSearch = () => {
    loadGames(statusFilter, searchQuery);
  };

  const handleAction = async () => {
    if (!confirmModal) return;

    const { type, gameId } = confirmModal;
    setActionLoading(gameId);
    setError(null);
    setSuccess(null);

    try {
      switch (type) {
        case 'hide':
          await apiClient.adminHideGame(gameId, moderationComment || undefined);
          setSuccess('Игра скрыта из каталога');
          break;
        case 'unhide':
          await apiClient.adminUnhideGame(gameId);
          setSuccess('Игра возвращена в каталог');
          break;
        case 'block':
          await apiClient.adminBlockGame(gameId, moderationComment || undefined);
          setSuccess('Игра заблокирована');
          break;
        case 'delete':
          await apiClient.adminDeleteGame(gameId);
          setSuccess('Игра удалена');
          break;
      }
      setConfirmModal(null);
      setModerationComment('');
      loadGames(statusFilter, searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(null);
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <AdminNav userRole={userRole} />
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">🎮 Все игры</h1>
            <p className="text-text-secondary mt-1">
              {total > 0 ? `Всего игр: ${total}` : 'Игр нет'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="input-field max-w-[200px]"
          >
            <option value="">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Поиск по названию или городу..."
              className="input-field min-w-[250px]"
            />
            <button onClick={handleSearch} className="btn-primary text-sm">
              Найти
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm mb-4">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-success/10 text-success text-sm mb-4">{success}</div>
        )}

        {games.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Игр нет</h2>
            <p className="text-text-secondary">Нет игр, соответствующих фильтрам</p>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <div key={game.id} className="card p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary truncate">
                        {game.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[game.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {STATUS_LABELS[game.status] || game.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                      <span>📍 {game.city}</span>
                      <span>⏱️ {game.duration} мин</span>
                      <span>👥 {game._count.registrations}/{game.maxTeams} команд</span>
                      {game.price > 0 && <span>💰 {game.price} ₽</span>}
                      <span>📅 {new Date(game.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
                      <span className="text-text-secondary">
                        Орг: <strong>{game.organizer.name}</strong>
                      </span>
                      {game.scenario && (
                        <span className="text-text-secondary">
                          Сценарий: {game.scenario.name}
                        </span>
                      )}
                      {game.moderationComment && (
                        <span className="text-yellow-400">
                          Комментарий: {game.moderationComment}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row lg:flex-col gap-2 items-start">
                    {game.status !== 'HIDDEN' && game.status !== 'BLOCKED' && (
                      <>
                        <button
                          onClick={() => setConfirmModal({ type: 'hide', gameId: game.id, gameTitle: game.title })}
                          disabled={actionLoading === game.id}
                          className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-sm font-medium disabled:opacity-50"
                        >
                          🔇 Скрыть
                        </button>
                        <button
                          onClick={() => setConfirmModal({ type: 'block', gameId: game.id, gameTitle: game.title })}
                          disabled={actionLoading === game.id}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium disabled:opacity-50"
                        >
                          🚫 Заблокировать
                        </button>
                      </>
                    )}
                    {game.status === 'HIDDEN' && (
                      <button
                        onClick={() => setConfirmModal({ type: 'unhide', gameId: game.id, gameTitle: game.title })}
                        disabled={actionLoading === game.id}
                        className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium disabled:opacity-50"
                      >
                        ✅ Вернуть
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmModal({ type: 'delete', gameId: game.id, gameTitle: game.title })}
                      disabled={actionLoading === game.id}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium disabled:opacity-50"
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {confirmModal.type === 'hide' && '🔇 Скрыть игру'}
              {confirmModal.type === 'unhide' && '✅ Вернуть игру'}
              {confirmModal.type === 'block' && '🚫 Заблокировать игру'}
              {confirmModal.type === 'delete' && '🗑️ Удалить игру'}
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              Игра: <strong>{confirmModal.gameTitle}</strong>
            </p>
            
            {(confirmModal.type === 'hide' || confirmModal.type === 'block') && (
              <div className="mb-4">
                <label className="label">Комментарий модератора</label>
                <textarea
                  value={moderationComment}
                  onChange={(e) => setModerationComment(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder="Укажите причину..."
                />
              </div>
            )}

            {confirmModal.type === 'delete' && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 text-error text-sm">
                ⚠️ Игра будет безвозвратно удалена. Это действие нельзя отменить.
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setConfirmModal(null); setModerationComment(''); }}
                className="btn-secondary text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading === confirmModal.gameId}
                className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                  confirmModal.type === 'delete' || confirmModal.type === 'block'
                    ? 'bg-error text-white hover:bg-error/90'
                    : confirmModal.type === 'unhide'
                    ? 'bg-success text-white hover:bg-success/90'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {actionLoading === confirmModal.gameId ? '...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}