'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getTeam,
  getTeamPrivate,
  getProfile,
  getMyTeam,
  leaveTeam,
  removeMember,
  updateMemberRole,
  approveJoinRequest,
  rejectJoinRequest,
  acceptInvite,
  declineInvite,
  transferOwnership,
  acceptTransfer,
  getTeamHistory,
  type TeamDetails,
  type TeamPrivateDetails,
  type User,
  type MyTeam,
} from '@/lib/api/client';
import Header from '@/components/ui/Header';
import InviteModal from '@/components/teams/InviteModal';
import JoinRequestModal from '@/components/teams/JoinRequestModal';
import ReportButton from '@/components/complaints/ReportButton';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активна',
  RECRUITING: 'Набирает',
  INACTIVE: 'Неактивна',
  ARCHIVED: 'В архиве',
  DELETED: 'Удалена',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  RECRUITING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  INACTIVE: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ARCHIVED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  DELETED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const ROLE_LABELS: Record<string, string> = {
  CAPTAIN: 'Капитан',
  CO_CAPTAIN: 'Сокапитан',
  MEMBER: 'Участник',
};

type Tab = 'info' | 'members' | 'settings' | 'requests' | 'history';

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [privateData, setPrivateData] = useState<TeamPrivateDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myMembership, setMyMembership] = useState<MyTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; action: string; actorName: string; details: Record<string, unknown>; createdAt: string }>>([]);
  const [transferUserId, setTransferUserId] = useState('');
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  const teamId = params.id as string;

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Redirect if ID is missing or not a valid UUID
  useEffect(() => {
    if (!teamId || !UUID_REGEX.test(teamId)) {
      router.push('/teams');
    }
  }, [teamId, router]);

  useEffect(() => {
    if (!teamId || !UUID_REGEX.test(teamId)) return;
    async function loadData() {
      try {
        const [teamResponse, profileResponse, myTeamResponse] = await Promise.allSettled([
          getTeam(teamId),
          getProfile(),
          getMyTeam(),
        ]);

        if (teamResponse.status === 'fulfilled') {
          setTeam(teamResponse.value.data);
        } else {
          setError('Не удалось загрузить команду');
        }

        if (profileResponse.status === 'fulfilled') {
          setCurrentUser(profileResponse.value.data);
        }

        if (myTeamResponse.status === 'fulfilled') {
          setMyMembership(myTeamResponse.value.data);
        }
      } catch {
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [teamId]);

  const loadPrivateData = async () => {
    try {
      const response = await getTeamPrivate(teamId);
      setPrivateData(response.data);
    } catch {
      // Not captain — ignore
    }
  };

  const loadHistory = async () => {
    try {
      const response = await getTeamHistory(teamId);
      setHistory(response.data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (activeTab === 'settings' && isCaptain) {
      loadPrivateData();
    }
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const handleLeave = async () => {
    if (!confirm('Вы уверены, что хотите покинуть команду?')) return;

    setActionLoading(true);
    try {
      await leaveTeam(teamId);
      router.push('/teams');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка выхода из команды');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите исключить участника?')) return;

    setActionLoading(true);
    try {
      await removeMember(teamId, userId);
      const response = await getTeam(teamId);
      setTeam(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка исключения участника');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    setActionLoading(true);
    try {
      await updateMemberRole(teamId, userId, { role });
      const response = await getTeam(teamId);
      setTeam(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения роли');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      await approveJoinRequest(teamId, requestId);
      await loadPrivateData();
      const response = await getTeam(teamId);
      setTeam(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка одобрения заявки');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      await rejectJoinRequest(teamId, requestId);
      await loadPrivateData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отклонения заявки');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    setActionLoading(true);
    try {
      await acceptInvite(teamId, inviteId);
      router.push(`/teams/${teamId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка принятия приглашения');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    setActionLoading(true);
    try {
      await declineInvite(teamId, inviteId);
      await loadPrivateData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отклонения приглашения');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferUserId) return;
    if (!confirm('Вы уверены? После передачи вы перестанете быть капитаном. Новый капитан должен принять передачу.')) return;

    setActionLoading(true);
    try {
      await transferOwnership(teamId, { toUserId: transferUserId });
      setShowTransferConfirm(false);
      setTransferUserId('');
      alert('Запрос на передачу капитанства отправлен. Ожидайте подтверждения от нового капитана.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка передачи капитанства');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptTransfer = async () => {
    setActionLoading(true);
    try {
      await acceptTransfer(teamId);
      router.push(`/teams/${teamId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка принятия капитанства');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card animate-pulse">
            <div className="h-8 bg-surface-elevated rounded mb-4 w-1/2" />
            <div className="h-4 bg-surface-elevated rounded mb-2 w-3/4" />
            <div className="h-4 bg-surface-elevated rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card border border-red-500/20 bg-red-500/5">
            <p className="text-red-400">{error || 'Команда не найдена'}</p>
            <Link href="/teams" className="btn-primary mt-4 inline-block">
              К списку команд
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCaptain = currentUser?.id === team.captain.id;
  const isMember = team.members.some((m) => m.id === currentUser?.id);
  const myMemberData = team.members.find((m) => m.id === currentUser?.id);
  const isCoCaptain = myMemberData?.role === 'CO_CAPTAIN';
  const canManage = isCaptain || isCoCaptain;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Информация' },
    { key: 'members', label: 'Участники' },
    { key: 'history', label: 'История' },
  ];

  if (canManage) {
    tabs.push({ key: 'requests', label: 'Заявки' });
    tabs.push({ key: 'settings', label: 'Управление' });
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link href="/teams" className="text-text-secondary hover:text-text-primary text-sm mb-4 inline-block">
          ← Назад к командам
        </Link>

        {/* Team Header */}
        <div className="card mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-surface-elevated flex-shrink-0 overflow-hidden">
              {team.avatar ? (
                <Image
                  src={team.avatar}
                  alt={team.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-text-secondary">
                  {team.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-text-primary mb-1">{team.name}</h1>
                    <ReportButton
                      targetType="TEAM"
                      targetId={team.id}
                      targetLabel={team.name}
                      variant="icon"
                    />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[team.status] || STATUS_COLORS.ACTIVE}`}>
                      {STATUS_LABELS[team.status] || team.status}
                    </span>
                    {team.city && (
                      <span className="text-sm text-text-secondary">📍 {team.city}</span>
                    )}
                    {team.country && (
                      <span className="text-sm text-text-secondary">{team.country}</span>
                    )}
                    <span className="text-sm text-text-secondary">
                      {team.membersCount} {team.membersCount === 1 ? 'участник' : 'участников'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!isMember && (
                    <>
                      {(team.joinPolicy === 'OPEN' || team.joinPolicy === 'REQUEST') && (
                        <button
                          onClick={() => setShowJoinRequestModal(true)}
                          className="btn-primary"
                        >
                          {team.joinPolicy === 'OPEN' ? 'Вступить' : 'Подать заявку'}
                        </button>
                      )}
                    </>
                  )}
                  {isMember && !isCaptain && (
                    <button
                      onClick={handleLeave}
                      disabled={actionLoading}
                      className="btn-secondary disabled:opacity-50"
                    >
                      {actionLoading ? '...' : 'Покинуть команду'}
                    </button>
                  )}
                  {canManage && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="btn-primary"
                    >
                      Пригласить
                    </button>
                  )}
                </div>
              </div>
              {team.description && (
                <p className="text-text-secondary mt-3">{team.description}</p>
              )}
              {team.tags && team.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {team.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-surface-elevated rounded-full text-text-secondary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {team.website && (
                <a
                  href={team.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  {team.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                activeTab === tab.key
                  ? 'text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary">{team.membersCount}</div>
              <div className="text-sm text-text-secondary">Участников</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary">{team.membersCount > 0 ? '✓' : '—'}</div>
              <div className="text-sm text-text-secondary">Статус</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary">
                {new Date(team.createdAt).toLocaleDateString('ru-RU')}
              </div>
              <div className="text-sm text-text-secondary">Создана</div>
            </div>
          </div>
        )}

        {/* Tab: Members */}
        {activeTab === 'members' && (
          <div className="card">
            <h2 className="text-xl font-bold text-text-primary mb-4">Участники ({team.members.length})</h2>
            <div className="space-y-3">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-primary font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{member.name}</div>
                      <div className="text-sm text-text-secondary">
                        {ROLE_LABELS[member.role] || member.role}
                        {member.joinedAt && ` • с ${new Date(member.joinedAt).toLocaleDateString('ru-RU')}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && member.role !== 'CAPTAIN' && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          disabled={actionLoading}
                          className="text-xs bg-surface-elevated border border-border rounded px-2 py-1 text-text-primary disabled:opacity-50"
                        >
                          <option value="MEMBER">Участник</option>
                          <option value="CO_CAPTAIN">Сокапитан</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={actionLoading}
                          className="text-error hover:text-error/80 text-sm disabled:opacity-50"
                        >
                          Исключить
                        </button>
                      </>
                    )}
                    {isCaptain && member.role !== 'CAPTAIN' && (
                      <button
                        onClick={() => {
                          setTransferUserId(member.id);
                          setShowTransferConfirm(true);
                        }}
                        disabled={actionLoading}
                        className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
                      >
                        Передать капитанство
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Requests & Invites */}
        {activeTab === 'requests' && canManage && (
          <div className="space-y-6">
            {/* Pending Join Requests */}
            <div className="card">
              <h2 className="text-xl font-bold text-text-primary mb-4">Заявки на вступление</h2>
              {!privateData ? (
                <button onClick={loadPrivateData} className="btn-secondary text-sm">
                  Загрузить заявки
                </button>
              ) : privateData.joinRequests.length === 0 ? (
                <p className="text-text-secondary text-sm">Нет активных заявок</p>
              ) : (
                <div className="space-y-3">
                  {privateData.joinRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden flex-shrink-0">
                          {req.user.avatarUrl ? (
                            <Image
                              src={req.user.avatarUrl}
                              alt={req.user.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-primary font-semibold">
                              {req.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{req.user.name}</div>
                          {req.message && (
                            <div className="text-sm text-text-secondary">{req.message}</div>
                          )}
                          <div className="text-xs text-text-secondary">
                            {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          disabled={actionLoading}
                          className="text-sm text-green-400 hover:text-green-300 disabled:opacity-50"
                        >
                          Принять
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          disabled={actionLoading}
                          className="text-sm text-error hover:text-error/80 disabled:opacity-50"
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Invites */}
            <div className="card">
              <h2 className="text-xl font-bold text-text-primary mb-4">Отправленные приглашения</h2>
              {!privateData ? (
                <button onClick={loadPrivateData} className="btn-secondary text-sm">
                  Загрузить приглашения
                </button>
              ) : privateData.invites.length === 0 ? (
                <p className="text-text-secondary text-sm">Нет активных приглашений</p>
              ) : (
                <div className="space-y-3">
                  {privateData.invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden flex-shrink-0">
                          {inv.invitedUser.avatarUrl ? (
                            <Image
                              src={inv.invitedUser.avatarUrl}
                              alt={inv.invitedUser.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-primary font-semibold">
                              {inv.invitedUser.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{inv.invitedUser.name}</div>
                          <div className="text-xs text-text-secondary">
                            Статус: {inv.status === 'PENDING' ? 'Ожидает' : inv.status}
                            {' • '}до {new Date(inv.expiresAt).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                      {inv.status === 'PENDING' && (
                        <button
                          onClick={() => handleDeclineInvite(inv.id)}
                          disabled={actionLoading}
                          className="text-sm text-error hover:text-error/80 disabled:opacity-50"
                        >
                          Отозвать
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My pending invites (if current user has invites to this team) */}
            {myMembership && myMembership.myRole === 'INVITED' && (
              <div className="card border border-primary/20 bg-primary/5">
                <h2 className="text-xl font-bold text-text-primary mb-2">Вас пригласили в команду!</h2>
                <p className="text-text-secondary mb-4">Примите приглашение, чтобы присоединиться к команде.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAcceptInvite(myMembership.id)}
                    disabled={actionLoading}
                    className="btn-primary disabled:opacity-50"
                  >
                    Принять
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(myMembership.id)}
                    disabled={actionLoading}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Settings / Management */}
        {activeTab === 'settings' && canManage && (
          <div className="space-y-6">
            {/* Transfer Ownership */}
            {isCaptain && (
              <div className="card">
                <h2 className="text-xl font-bold text-text-primary mb-4">Передача капитанства</h2>
                <p className="text-text-secondary text-sm mb-4">
                  Вы можете передать капитанство другому участнику команды. Новый капитан должен будет подтвердить передачу.
                </p>
                {!showTransferConfirm ? (
                  <button
                    onClick={() => setShowTransferConfirm(true)}
                    className="btn-secondary"
                  >
                    Передать капитанство
                  </button>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={transferUserId}
                      onChange={(e) => setTransferUserId(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Выберите участника...</option>
                      {team.members
                        .filter((m) => m.role !== 'CAPTAIN')
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                    <div className="flex gap-3">
                      <button
                        onClick={handleTransferOwnership}
                        disabled={!transferUserId || actionLoading}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? 'Отправка...' : 'Подтвердить передачу'}
                      </button>
                      <button
                        onClick={() => {
                          setShowTransferConfirm(false);
                          setTransferUserId('');
                        }}
                        className="btn-secondary"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Accept Transfer (for co-captain who was offered) */}
            {!isCaptain && isMember && (
              <div className="card">
                <h2 className="text-xl font-bold text-text-primary mb-4">Капитанство</h2>
                <p className="text-text-secondary text-sm mb-4">
                  Если капитан инициировал передачу капитанства, вы можете принять её здесь.
                </p>
                <button
                  onClick={handleAcceptTransfer}
                  disabled={actionLoading}
                  className="btn-primary disabled:opacity-50"
                >
                  {actionLoading ? '...' : 'Принять капитанство'}
                </button>
              </div>
            )}

            {/* Team Limits */}
            {privateData?.settings?.limits && (
              <div className="card">
                <h2 className="text-xl font-bold text-text-primary mb-4">Лимиты команды</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Макс. участников:</span>
                    <span className="text-text-primary ml-2 font-medium">{privateData.settings.limits.maxMembers}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Приглашений в день:</span>
                    <span className="text-text-primary ml-2 font-medium">{privateData.settings.limits.maxInvitesPerDay}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Макс. заявок:</span>
                    <span className="text-text-primary ml-2 font-medium">{privateData.settings.limits.maxPendingRequests}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Сообщений в минуту:</span>
                    <span className="text-text-primary ml-2 font-medium">{privateData.settings.limits.maxChatMessagesPerMinute}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div className="card">
            <h2 className="text-xl font-bold text-text-primary mb-4">История команды</h2>
            {history.length === 0 ? (
              <p className="text-text-secondary text-sm">История пуста</p>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 py-2 border-b border-border last:border-0 text-sm"
                  >
                    <span className="text-text-secondary whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <span className="text-text-primary font-medium">{entry.actorName}</span>
                    <span className="text-text-secondary">{entry.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="fixed bottom-4 right-4 p-3 rounded-lg bg-error/10 text-error text-sm border border-error/20 max-w-md">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-error hover:text-error/80"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <InviteModal
        teamId={teamId}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          if (isCaptain || isCoCaptain) loadPrivateData();
        }}
      />
      <JoinRequestModal
        teamId={teamId}
        isOpen={showJoinRequestModal}
        onClose={() => setShowJoinRequestModal(false)}
        onSuccess={() => {
          alert('Заявка отправлена! Ожидайте решения капитана.');
        }}
      />
    </div>
  );
}
