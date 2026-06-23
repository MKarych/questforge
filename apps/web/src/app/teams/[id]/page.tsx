'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTeam, getProfile, leaveTeam, removeMember, type TeamDetails, type User } from '@/lib/api/client';
import Header from '@/components/ui/Header';

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const teamId = params.id as string;

  useEffect(() => {
    async function loadData() {
      try {
        const [teamResponse, profileResponse] = await Promise.allSettled([
          getTeam(teamId),
          getProfile(),
        ]);

        if (teamResponse.status === 'fulfilled') {
          setTeam(teamResponse.value.data);
        } else {
          setError('Не удалось загрузить команду');
        }

        if (profileResponse.status === 'fulfilled') {
          setCurrentUser(profileResponse.value.data);
        }
      } catch {
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [teamId]);

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
      // Обновить данные
      const response = await getTeam(teamId);
      setTeam(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка исключения участника');
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
          <div className="card border-error">
            <p className="text-error">{error || 'Команда не найдена'}</p>
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/teams" className="text-text-secondary hover:text-text-primary text-sm mb-4 inline-block">
            ← Назад к командам
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">{team.name}</h1>
              {team.description && (
                <p className="text-text-secondary">{team.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              {isMember && !isCaptain && (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="btn-secondary disabled:opacity-50"
                >
                  {actionLoading ? '...' : 'Покинуть команду'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary">{team.membersCount}</div>
            <div className="text-sm text-text-secondary">Участников</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary">{team.rating || '—'}</div>
            <div className="text-sm text-text-secondary">Рейтинг</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary">{team.gamesPlayed || 0}</div>
            <div className="text-sm text-text-secondary">Игр сыграно</div>
          </div>
        </div>

        {/* Captain */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Капитан</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {team.captain.avatar ? (
                <img src={team.captain.avatar} alt={team.captain.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg text-primary font-semibold">
                  {team.captain.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="font-semibold text-text-primary">{team.captain.name}</div>
              <div className="text-sm text-text-secondary">Капитан</div>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="card">
          <h2 className="text-xl font-bold text-text-primary mb-4">Участники</h2>
          <div className="space-y-3">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">{member.name}</div>
                    <div className="text-sm text-text-secondary">
                      {member.role === 'captain' ? 'Капитан' : 'Участник'}
                    </div>
                  </div>
                </div>
                {isCaptain && member.role !== 'captain' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={actionLoading}
                    className="text-error hover:text-error/80 text-sm disabled:opacity-50"
                  >
                    Исключить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
