'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminNav from '@/components/admin/AdminNav';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizerStatus: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  gamesCreated: number;
  scenariosCreated: number;
  _count: {
    captainTeams: number;
    reviews: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Role change modal
  const [roleModal, setRoleModal] = useState<{ userId: string; userName: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const profileResponse = await getProfile();
        const role = profileResponse.data.role;
        setUserRole(role);
        if (role !== 'ADMIN') {
          router.push('/');
          return;
        }

        await loadUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const loadUsers = async (searchTerm?: string) => {
    try {
      const response = await apiClient.getUsersAdmin({ search: searchTerm });
      setUsers(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  };

  const handleSearch = () => {
    loadUsers(search || undefined);
  };

  const handleBlock = async (userId: string) => {
    setActionLoading(userId);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.blockUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'BANNED' } : u))
      );
      setSuccess('Пользователь заблокирован');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (userId: string) => {
    setActionLoading(userId);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.unblockUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'ACTIVE' } : u))
      );
      setSuccess('Пользователь разблокирован');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleOpen = (userId: string, userName: string, currentRole: string) => {
    setRoleModal({ userId, userName, currentRole });
    setNewRole(currentRole);
  };

  const handleRoleConfirm = async () => {
    if (!roleModal || !newRole) return;

    setActionLoading(roleModal.userId);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.changeUserRole(roleModal.userId, newRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === roleModal.userId ? { ...u, role: newRole } : u
        )
      );
      setSuccess(`Роль изменена на ${newRole}`);
      setRoleModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      MODERATOR: 'bg-yellow-100 text-yellow-800',
      ORGANIZER: 'bg-green-100 text-green-800',
      AUTHOR: 'bg-purple-100 text-purple-800',
      PLAYER: 'bg-blue-100 text-blue-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    return status === 'BANNED'
      ? 'bg-error/10 text-error'
      : 'bg-success/10 text-success';
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
            <h1 className="text-3xl font-bold text-text-primary">👥 Пользователи</h1>
            <p className="text-text-secondary mt-1">Всего: {total}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm mb-4">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-success/10 text-success text-sm mb-4">{success}</div>
        )}

        {/* Search */}
        <div className="card mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Поиск по email или имени..."
              className="input-field flex-1"
            />
            <button onClick={handleSearch} className="btn-primary">
              🔍 Поиск
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Имя</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Роль</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Статус</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Игр</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Регистрация</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-elevated/50">
                  <td className="py-3 px-4">
                    <span className="text-text-primary font-medium">{user.name}</span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-sm">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(user.status)}`}>
                      {user.status === 'BANNED' ? 'Заблокирован' : 'Активен'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-sm">{user.gamesCreated}</td>
                  <td className="py-3 px-4 text-text-secondary text-sm">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {user.role !== 'ADMIN' && (
                        <>
                          {user.status === 'BANNED' ? (
                            <button
                              onClick={() => handleUnblock(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-xs px-2 py-1 rounded bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
                            >
                              Разблокировать
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-xs px-2 py-1 rounded bg-error/10 text-error hover:bg-error/20 disabled:opacity-50"
                            >
                              Заблокировать
                            </button>
                          )}
                          <button
                            onClick={() => handleRoleOpen(user.id, user.name, user.role)}
                            disabled={actionLoading === user.id}
                            className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                          >
                            Сменить роль
                          </button>
                        </>
                      )}
                      {user.role === 'ADMIN' && (
                        <span className="text-xs text-text-muted">Недоступно</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Сменить роль</h3>
            <p className="text-text-secondary text-sm mb-4">
              Пользователь: <strong>{roleModal.userName}</strong>
              <br />
              Текущая роль: <strong>{roleModal.currentRole}</strong>
            </p>
            <div className="mb-4">
              <label className="label">Новая роль</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="input-field"
              >
                <option value="PLAYER">PLAYER</option>
                <option value="AUTHOR">AUTHOR</option>
                <option value="ORGANIZER">ORGANIZER</option>
                <option value="MODERATOR">MODERATOR</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRoleModal(null)}
                className="btn-secondary text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleRoleConfirm}
                disabled={!newRole || newRole === roleModal.currentRole || actionLoading === roleModal.userId}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {actionLoading === roleModal.userId ? '...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}