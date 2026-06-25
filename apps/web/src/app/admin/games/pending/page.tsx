'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminNav from '@/components/admin/AdminNav';

interface PendingGame {
  id: string;
  title: string;
  description: string | null;
  city: string;
  date: string;
  price: number;
  maxTeams: number;
  duration: number;
  status: string;
  moderationStatus: string;
  submittedAt: string;
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
    reviews: number;
    gameTeams: number;
  };
}

export default function AdminGamesPendingPage() {
  const router = useRouter();
  const [games, setGames] = useState<PendingGame[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ gameId: string; gameTitle: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

        const response = await apiClient.getPendingGamesAdmin();
        setGames(response.data.items);
        setTotal(response.data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleApprove = async (gameId: string) => {
    setActionLoading(gameId);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.approveGame(gameId);
      setGames((prev) => prev.filter((g) => g.id !== gameId));
      setTotal((prev) => prev - 1);
      setSuccess('Игра одобрена! Она появится в публичном каталоге.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOpen = (gameId: string, gameTitle: string) => {
    setRejectModal({ gameId, gameTitle });
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal || !rejectReason.trim()) return;

    setActionLoading(rejectModal.gameId);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.rejectGame(rejectModal.gameId, rejectReason.trim());
      setGames((prev) => prev.filter((g) => g.id !== rejectModal.gameId));
      setTotal((prev) => prev - 1);
      setSuccess('Игра отклонена');
      setRejectModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCancel = () => {
    setRejectModal(null);
    setRejectReason('');
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
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">🎮 Модерация игр</h1>
            <p className="text-text-secondary mt-1">
              {total > 0 ? `${total} игр${total === 1 ? 'а' : 'ы'} ожидает проверки` : 'Нет игр на проверке'}
            </p>
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
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Все игры проверены</h2>
            <p className="text-text-secondary">Нет игр, ожидающих модерации</p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div key={game.id} className="card">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-1">{game.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-text-secondary mb-2">
                      <span>📍 {game.city}</span>
                      <span>⏱️ {game.duration} мин</span>
                      <span>👥 До {game.maxTeams} команд</span>
                      {game.price > 0 && <span>💰 {game.price} ₽</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="text-text-secondary">
                        Организатор: <strong>{game.organizer.name}</strong>
                      </span>
                      <span className="text-text-secondary">
                        Email: {game.organizer.email}
                      </span>
                      {game.scenario && (
                        <span className="text-text-secondary">
                          Сценарий: {game.scenario.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                      Подана: {new Date(game.submittedAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 items-start md:items-stretch">
                    <button
                      onClick={() => handleApprove(game.id)}
                      disabled={actionLoading === game.id}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {actionLoading === game.id ? '...' : '✅ Одобрить'}
                    </button>
                    <button
                      onClick={() => handleRejectOpen(game.id, game.title)}
                      disabled={actionLoading === game.id}
                      className="px-4 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 text-sm font-medium disabled:opacity-50"
                    >
                      ❌ Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Отклонить игру</h3>
            <p className="text-text-secondary text-sm mb-4">
              Игра: <strong>{rejectModal.gameTitle}</strong>
            </p>
            <div className="mb-4">
              <label className="label">Причина отклонения *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="Укажите причину отклонения..."
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={handleRejectCancel} className="btn-secondary text-sm">
                Отмена
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || actionLoading === rejectModal.gameId}
                className="px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 text-sm font-medium disabled:opacity-50"
              >
                {actionLoading === rejectModal.gameId ? '...' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}