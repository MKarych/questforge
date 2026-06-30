'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  email: string;
  role: string;
  joinedAt: string;
}

interface TeamDetail {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  banner: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  status: string;
  privacy: string;
  joinPolicy: string;
  tags: string[];
  captain: {
    id: string;
    name: string;
    avatarUrl: string | null;
    email: string;
  } | null;
  members: TeamMember[];
  membersCount: number;
  invitesCount: number;
  joinRequestsCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export default function AdminTeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Edit form state
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    country: '',
    website: '',
    status: '',
    privacy: '',
    joinPolicy: '',
    tags: '',
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

        const response = await apiClient.getAdminTeam(teamId);
        const teamData = response.data;
        setTeam(teamData);
        setForm({
          name: teamData.name || '',
          description: teamData.description || '',
          city: teamData.city || '',
          country: teamData.country || '',
          website: teamData.website || '',
          status: teamData.status || 'ACTIVE',
          privacy: teamData.privacy || 'PUBLIC',
          joinPolicy: teamData.joinPolicy || 'OPEN',
          tags: (teamData.tags || []).join(', '),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        router.push('/admin/teams');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [teamId, router]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const data: any = {};
      if (form.name !== team?.name) data.name = form.name;
      if (form.description !== team?.description) data.description = form.description || null;
      if (form.city !== team?.city) data.city = form.city || null;
      if (form.country !== team?.country) data.country = form.country || null;
      if (form.website !== team?.website) data.website = form.website || null;
      if (form.status !== team?.status) data.status = form.status;
      if (form.privacy !== team?.privacy) data.privacy = form.privacy;
      if (form.joinPolicy !== team?.joinPolicy) data.joinPolicy = form.joinPolicy;

      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const oldTags = (team?.tags || []).join(', ');
      if (tags.join(', ') !== oldTags) data.tags = tags;

      if (Object.keys(data).length === 0) {
        setSuccess('Нет изменений для сохранения');
        setEditMode(false);
        return;
      }

      const response = await apiClient.updateAdminTeam(teamId, data);
      setTeam(response.data);
      setSuccess('Команда обновлена');
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      setError(null);
      await apiClient.deleteAdminTeam(teamId);
      router.push('/admin/teams');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления команды');
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const isAdmin = userRole === 'ADMIN';

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

  if (error && !team) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <Link href="/admin/teams" className="btn-primary">← К списку команд</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Админ-панель</Link>
          <span>/</span>
          <Link href="/admin/teams" className="hover:text-primary transition-colors">Команды</Link>
          <span>/</span>
          <span className="text-text-primary">{team.name}</span>
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

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-surface-elevated flex items-center justify-center text-2xl overflow-hidden">
              {team.avatar ? (
                <img src={team.avatar} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                '👥'
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{team.name}</h1>
              <p className="text-text-secondary text-sm">@{team.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="btn-secondary"
              >
                ✏️ Редактировать
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger"
              >
                🗑 Удалить
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Mode */}
            {editMode ? (
              <div className="card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Редактирование команды</h2>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Название</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Описание</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-field w-full min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Город</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Страна</label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Веб-сайт</label>
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Статус</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="ACTIVE">Активна</option>
                      <option value="INACTIVE">Неактивна</option>
                      <option value="BANNED">Заблокирована</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Видимость</label>
                    <select
                      value={form.privacy}
                      onChange={(e) => setForm({ ...form, privacy: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="PUBLIC">Публичная</option>
                      <option value="PRIVATE">Приватная</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Вступление</label>
                    <select
                      value={form.joinPolicy}
                      onChange={(e) => setForm({ ...form, joinPolicy: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="OPEN">Свободное</option>
                      <option value="INVITE">По приглашению</option>
                      <option value="REQUEST">По заявке</option>
                      <option value="CLOSED">Закрыто</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Теги (через запятую)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="input-field w-full"
                    placeholder="quest, adventure, puzzle"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setEditMode(false);
                      if (team) {
                        setForm({
                          name: team.name || '',
                          description: team.description || '',
                          city: team.city || '',
                          country: team.country || '',
                          website: team.website || '',
                          status: team.status || 'ACTIVE',
                          privacy: team.privacy || 'PUBLIC',
                          joinPolicy: team.joinPolicy || 'OPEN',
                          tags: (team.tags || []).join(', '),
                        });
                      }
                    }}
                    className="btn-secondary"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Информация</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-text-secondary">Статус</span>
                    <p>
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
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Видимость</span>
                    <p className="text-text-primary">{team.privacy === 'PUBLIC' ? 'Публичная' : 'Приватная'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Вступление</span>
                    <p className="text-text-primary">
                      {team.joinPolicy === 'OPEN' ? 'Свободное' :
                       team.joinPolicy === 'INVITE' ? 'По приглашению' :
                       team.joinPolicy === 'REQUEST' ? 'По заявке' :
                       team.joinPolicy === 'CLOSED' ? 'Закрыто' : team.joinPolicy}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Город</span>
                    <p className="text-text-primary">{team.city || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Страна</span>
                    <p className="text-text-primary">{team.country || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Веб-сайт</span>
                    <p className="text-text-primary">
                      {team.website ? (
                        <a href={team.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {team.website}
                        </a>
                      ) : '—'}
                    </p>
                  </div>
                </div>

                {team.description && (
                  <div>
                    <span className="text-sm text-text-secondary">Описание</span>
                    <p className="text-text-primary mt-1 whitespace-pre-wrap">{team.description}</p>
                  </div>
                )}

                {team.tags && team.tags.length > 0 && (
                  <div>
                    <span className="text-sm text-text-secondary">Теги</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {team.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">{team.membersCount}</div>
                    <div className="text-xs text-text-secondary">Участников</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">{team.invitesCount}</div>
                    <div className="text-xs text-text-secondary">Приглашений</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">{team.joinRequestsCount}</div>
                    <div className="text-xs text-text-secondary">Заявок</div>
                  </div>
                </div>

                <div className="text-xs text-text-tertiary space-y-1 pt-2 border-t border-border">
                  <p>Создана: {new Date(team.createdAt).toLocaleString('ru-RU')}</p>
                  <p>Обновлена: {new Date(team.updatedAt).toLocaleString('ru-RU')}</p>
                  {team.deletedAt && (
                    <p className="text-error">Удалена: {new Date(team.deletedAt).toLocaleString('ru-RU')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Участники ({team.members.length})
              </h2>
              {team.members.length === 0 ? (
                <p className="text-text-secondary text-sm">Нет участников</p>
              ) : (
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-elevated/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-sm overflow-hidden">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/profile/${member.id}`}
                            className="text-text-primary font-medium hover:text-primary transition-colors"
                          >
                            {member.name}
                          </Link>
                          <p className="text-xs text-text-secondary">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          member.role === 'CAPTAIN' ? 'bg-warning/10 text-warning' :
                          member.role === 'CO_CAPTAIN' ? 'bg-primary/10 text-primary' :
                          'bg-surface-elevated text-text-secondary'
                        }`}>
                          {member.role === 'CAPTAIN' ? 'Капитан' :
                           member.role === 'CO_CAPTAIN' ? 'Сокапитан' :
                           member.role === 'MEMBER' ? 'Участник' : member.role}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {new Date(member.joinedAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Captain Info */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Капитан</h3>
              {team.captain ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden">
                    {team.captain.avatarUrl ? (
                      <img src={team.captain.avatarUrl} alt={team.captain.name} className="w-full h-full object-cover" />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/profile/${team.captain.id}`}
                      className="text-text-primary font-medium hover:text-primary transition-colors"
                    >
                      {team.captain.name}
                    </Link>
                    <p className="text-xs text-text-secondary">{team.captain.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary text-sm">Нет капитана</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Действия</h3>
              <div className="space-y-2">
                <Link
                  href={`/teams/${team.id}`}
                  target="_blank"
                  className="block w-full text-center btn-secondary text-sm"
                >
                  👀 Открыть на сайте
                </Link>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="block w-full text-center btn-secondary text-sm"
                  >
                    ✏️ Редактировать
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="block w-full text-center btn-danger text-sm"
                  >
                    🗑 Удалить команду
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Удаление команды</h3>
            <p className="text-text-secondary mb-6">
              Вы уверены, что хотите удалить команду <strong>{team.name}</strong>?
              Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="btn-danger"
              >
                {deleteLoading ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}