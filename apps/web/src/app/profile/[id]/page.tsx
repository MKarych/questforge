'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getMyTeam, type MyTeam } from '@/lib/api/client';

interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  bio: string | null;
  telegram: string | null;
  vk: string | null;
  whatsapp: string | null;
  role: string;
  rating: number | null;
  reputation: number | null;
  gamesPlayed: number;
  gamesCreated: number;
  gamesConducted: number;
  scenariosCreated: number;
  reviewsCount: number;
  createdAt: string;
  lastSeenAt: string | null;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export default function PublicProfilePage() {
  const params = useParams() as { id: string };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${API_URL}/users/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Профиль не найден');
        }

        const data = await response.json();
        setProfile(data);

        // Загружаем команду для текущего пользователя
        try {
          const teamResponse = await getMyTeam();
          if (teamResponse.data) {
            setMyTeam(teamResponse.data);
          }
        } catch {
          // Игнорируем ошибки загрузки команды
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [params.id]);

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

  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <div className="text-6xl mb-6">😕</div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              {error || 'Профиль не найден'}
            </h1>
            <Link href="/games" className="btn-primary">
              Вернуться к играм
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    PLAYER: 'bg-blue-100 text-blue-800',
    AUTHOR: 'bg-purple-100 text-purple-800',
    ORGANIZER: 'bg-green-100 text-green-800',
    ADMIN: 'bg-red-100 text-red-800',
    MODERATOR: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl text-primary">
                    {profile.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row gap-3 items-center md:items-start mb-2">
                  <h1 className="text-3xl font-bold text-text-primary">{profile.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[profile.role] || 'bg-gray-100 text-gray-800'}`}>
                    {profile.role}
                  </span>
                </div>

                {profile.city && (
                  <p className="text-text-secondary mb-2">📍 {profile.city}</p>
                )}

                {profile.bio && (
                  <p className="text-text-secondary mb-4 max-w-xl">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {profile.telegram && (
                    <a
                      href={`https://t.me/${profile.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Telegram: {profile.telegram}
                    </a>
                  )}
                  {profile.vk && (
                    <a
                      href={profile.vk}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      VK
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a
                      href={`https://wa.me/${profile.whatsapp.replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:underline"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">
                  {profile.rating?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-text-secondary">рейтинг</div>
                <div className="text-lg font-semibold text-text-primary mt-2">
                  ⭐ {profile.reputation || 0}
                </div>
                <div className="text-sm text-text-secondary">репутация</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.gamesPlayed}</div>
              <div className="text-sm text-text-secondary">Игр пройдено</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.gamesCreated}</div>
              <div className="text-sm text-text-secondary">Игр создано</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.gamesConducted}</div>
              <div className="text-sm text-text-secondary">Игр проведено</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.scenariosCreated}</div>
              <div className="text-sm text-text-secondary">Сценариев</div>
            </div>
          </div>

          {/* My Team */}
          {myTeam && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary">🏴 Моя команда</h2>
                <Link href={`/teams/${myTeam.id}`} className="text-primary hover:text-primary-hover text-sm font-medium">
                  Подробнее →
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-lg font-semibold text-text-primary">{myTeam.name}</div>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {myTeam.myRole === 'captain' ? 'Капитан' : 'Участник'}
                </span>
              </div>
              <div className="mt-3 flex -space-x-2">
                {myTeam?.members?.slice(0, 5)?.map((member) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background"
                    title={member.name}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs text-primary font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
                {myTeam?.members?.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center border-2 border-background text-xs text-text-secondary">
                    +{myTeam.members.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Achievements */}
          {profile.achievements && profile.achievements.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">🏆 Достижения</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 text-center"
                  >
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <div className="font-semibold text-text-primary text-sm mb-1">
                      {achievement.name}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {achievement.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Info */}
          <div className="card">
            <h2 className="text-xl font-bold text-text-primary mb-4">📊 Активность</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-text-secondary">На платформе с</div>
                <div className="text-text-primary">
                  {new Date(profile.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Был в сети</div>
                <div className="text-text-primary">
                  {profile.lastSeenAt
                    ? new Date(profile.lastSeenAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Давно'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
