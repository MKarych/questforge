'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminTeam {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  description: string | null;
  city: string | null;
  status: string;
  privacy: string;
  captain: {
    id: string;
    name: string;
    avatarUrl: string | null;
    email: string;
  } | null;
  membersCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export default function AdminTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [page, setPage] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const limit = 20;

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);

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

        await loadTeams(role);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  useEffect(() => {
    if (userRole) {
      loadTeams(userRole);
    }
  }, [search, statusFilter, cityFilter, page]);

  async function loadTeams(role?: string) {
    try {
      setLoading(true);
      setError(null);
      const effectiveRole = role || userRole;
      if (!effectiveRole) return;

      const response = await apiClient.getAdminTeams({
        search: search || undefined,
        status: statusFilter || undefined,
        city: cityFilter || undefined,
        limit,
        offset: page * limit,
      });
      setTeams(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки команд');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return;
    const teamId = deleteModal.id;
    try {
      setActionLoading(teamId);
      setError(null);
      setSuccess(null);
      await apiClient.deleteAdminTeam(teamId);
      setSuccess(`Команда «${deleteModal.name}» удалена`);
      setDeleteModal(null);
      loadTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления команды');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">👥 Управление командами</h1>
          <span className="text-sm text-text-secondary">
            {isAdmin ? 'Администратор' : 'Модератор'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            📊 Дашборд
          </Link>
          <Link
            href="/admin/games/pending"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            🎮 Модерация игр
          </Link>
          <Link
            href="/admin/organizers/applications"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            📋 Заявки организаторов
          </Link>
          {isAdmin && (
            <Link
              href="/admin/users"
              className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
            >
              👥 Пользователи
            </Link>
          )}
          <Link
            href="/admin/teams"
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium"
          >
            👥 Команды
          </Link>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="input flex-1 min-w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="input w-auto"
          >
            <option value="">Все статусы</option>
            <option value="ACTIVE">Активна</option>
            <option value="INACTIVE">Неактивна</option>
            <option value="BANNED">Заблокирована</option>
            <option value="DELETED">Удалена</option>
          </select>
          <input
            type="text"
            placeholder="Город..."
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(0); }}
            className="input w-auto"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : teams.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-text-secondary mb-4">Команды не найдены</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-secondary text-sm font-medium">Команда</th>
                    <th className="text-left py-3 px-4 text-text-secondary text-sm font-medium">Капитан</th>
                    <th className="text-center py-3 px-4 text-text-secondary text-sm font-medium">Участников</th>
                    <th className="text-center py-3 px-4 text-text-secondary text-sm font-medium">Статус</th>
                    <th className="text-left py-3 px-4 text-text-secondary text-sm font-medium">Город</th>
                    <th className="text-left py-3 px-4 text-text-secondary text-sm font-medium">Создана</th>
                    <th className="text-center py-3 px-4 text-text-secondary text-sm font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id} className="border-b border-border hover:bg-surface-elevated/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/teams/${team.id}`}
                          className="text-text-primary font-medium hover:text-primary transition-colors"
                        >
                          {team.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {team.captain ? (
                          <Link
                            href={`/profile/${team.captain.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {team.captain.name}
                          </Link>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-text-secondary">
                        {team.membersCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          team.status === 'ACTIVE' ? 'bg-success/10 text-success' :
                          team.status === 'INACTIVE' ? 'bg-warning/10 text-warning' :
                          team.status === 'BANNED' ? 'bg-error/10 text-error' :
                          team.status === 'DELETED' ? 'bg-error/20 text-error line-through' :
                          'bg-surface-elevated text-text-secondary'
                        }`}>
                          {team.status === 'ACTIVE' ? 'Активна' :
                           team.status === 'INACTIVE' ? 'Неактивна' :
                           team.status === 'BANNED' ? 'Заблокирована' :
                           team.status === 'DELETED' ? 'Удалена' :
                           team.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {team.city || '—'}
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-sm">
                        {new Date(team.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/teams/${team.id}`}
                            className="btn-secondary text-xs py-1 px-3"
                          >
                            Детали
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteModal({ id: team.id, name: team.name })}
                              disabled={actionLoading === team.id}
                              className="btn-danger text-xs py-1 px-3"
                            >
                              {actionLoading === team.id ? '...' : 'Удалить'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
                >
                  ← Назад
                </button>
                <span className="text-text-secondary text-sm">
                  {page + 1} из {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
                >
                  Вперед →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Удаление команды</h3>
            <p className="text-text-secondary mb-6">
              Вы уверены, что хотите удалить команду <strong>{deleteModal.name}</strong>?
              Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteModal.id}
                className="btn-danger"
              >
                {actionLoading === deleteModal.id ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}