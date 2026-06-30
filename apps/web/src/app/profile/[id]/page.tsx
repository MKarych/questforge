'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';
import { apiClient } from '@/lib/api/client';
import ReportButton from '@/components/complaints/ReportButton';

interface PublicProfile {
  uuid: string;
  username: string;
  slug: string;
  avatar: string | null;
  bio: string;
  city: string;
  rating: number;
  trustScore: number;
  gamesPlayed: number;
  gamesCreated: number;
  gamesConducted: number;
  scenariosCreated: number;
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
  friendsCount?: number;
  achievements: Achievement[];
  lastSeenAt: string | null;
  createdAt: string;
}

interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface ReviewItem {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  game: {
    id: string;
    title: string;
    imageUrl: string | null;
  };
}

interface TeamItem {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  captain: { id: string; username: string; avatarUrl: string | null };
  _count: { members: number; games: number };
}

interface ScenarioItem {
  id: string;
  name: string;
  version: number;
  isPublished: boolean;
  createdAt: string;
  _count: { games: number; purchases: number };
}

const ACTIVITY_LABELS: Record<string, string> = {
  achievement: '🎯 Получено достижение',
  game_played: '🎮 Прошёл игру',
  game_created: '📅 Создал игру',
  scenario_created: '📝 Создал сценарий',
  review_left: '⭐ Оставил отзыв',
  team_joined: '👥 Присоединился к команде',
};

export default function PublicProfilePage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const { user } = useUser();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [activeTab, setActiveTab] = useState<'activity' | 'reviews' | 'teams' | 'scenarios'>('activity');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Social state
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const isOwnProfile = user?.uuid === params.id || user?.id === params.id;

  const loadSocialStatus = useCallback(async () => {
    if (!user || isOwnProfile) return;
    try {
      const [friendRes, pendingRes, blockedRes] = await Promise.allSettled([
        apiClient.get<{ data: boolean }>(`/users/${params.id}/is-friend`),
        apiClient.get<{ data: boolean }>(`/users/${params.id}/has-pending-request`),
        apiClient.get<{ data: boolean }>(`/users/${params.id}/is-blocked`),
      ]);
      if (friendRes.status === 'fulfilled') setIsFriend(friendRes.value.data);
      if (pendingRes.status === 'fulfilled') {
        setHasPendingRequest(pendingRes.value.data);
        if (pendingRes.value.data) {
          // Get the pending request ID
          const reqs = await apiClient.getFriendRequests();
          const outgoing = reqs.data?.outgoing || [];
          const found = outgoing.find(r => r.receiver.id === params.id);
          if (found) setPendingRequestId(found.id);
        }
      }
      if (blockedRes.status === 'fulfilled') setIsBlocked(blockedRes.value.data);
    } catch {
      // ignore social status errors
    }
  }, [user, params.id, isOwnProfile]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await apiClient.get<any>(`/users/${params.id}`);
        setProfile(response.data);

        // Загружаем дополнительные данные
        const promises: Promise<void>[] = [];

        // Activity Feed
        promises.push(
          apiClient.get<any>(`/users/${params.id}/activity?limit=10`).then(r => {
            if (r.data?.items) setActivity(r.data.items);
          }).catch(() => {})
        );

        // Reviews
        promises.push(
          apiClient.get<any>(`/users/${params.id}/reviews?limit=5`).then(r => {
            if (r.data?.items) setReviews(r.data.items);
          }).catch(() => {})
        );

        // Teams
        promises.push(
          apiClient.get<any>(`/users/${params.id}/teams`).then(r => {
            if (Array.isArray(r.data)) setTeams(r.data);
          }).catch(() => {})
        );

        // Scenarios
        promises.push(
          apiClient.get<any>(`/users/${params.id}/scenarios?limit=5`).then(r => {
            if (r.data?.items) setScenarios(r.data.items);
          }).catch(() => {})
        );

        await Promise.allSettled(promises);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
    loadSocialStatus();
  }, [params.id, loadSocialStatus]);

  const handleSendFriendRequest = async () => {
    setSocialLoading(true);
    try {
      const res = await apiClient.sendFriendRequest(params.id);
      setHasPendingRequest(true);
      setPendingRequestId(res.data.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      setError(msg);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!pendingRequestId) return;
    setSocialLoading(true);
    try {
      await apiClient.cancelFriendRequest(pendingRequestId);
      setHasPendingRequest(false);
      setPendingRequestId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      setError(msg);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    setSocialLoading(true);
    try {
      await apiClient.removeFriend(params.id);
      setIsFriend(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      setError(msg);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleBlockUser = async () => {
    setSocialLoading(true);
    try {
      await apiClient.socialBlockUser(params.id);
      setIsBlocked(true);
      setIsFriend(false);
      setHasPendingRequest(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      setError(msg);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    setSocialLoading(true);
    try {
      await apiClient.socialUnblockUser(params.id);
      setIsBlocked(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      setError(msg);
    } finally {
      setSocialLoading(false);
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

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ===== HEADER CARD ===== */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Если аватар не загрузился — показываем заглушку
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        `<span class="text-5xl text-primary">${profile.username?.charAt(0)?.toUpperCase() || '?'}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-5xl text-primary">
                    {profile.username?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row gap-3 items-center md:items-start mb-2">
                  <h1 className="text-3xl font-bold text-text-primary">
                    @{profile.username}
                  </h1>
                  {isOwnProfile && (
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Редактировать
                    </Link>
                  )}
                </div>

                {profile.city && (
                  <p className="text-text-secondary mb-2">📍 {profile.city}</p>
                )}

                {profile.bio && (
                  <p className="text-text-secondary mb-4 max-w-xl">{profile.bio}</p>
                )}

                {/* Followers/Following/Friends */}
                <div className="flex gap-4 text-sm text-text-secondary flex-wrap justify-center md:justify-start">
                  <span><strong className="text-text-primary">{profile.followersCount}</strong> подписчиков</span>
                  <span><strong className="text-text-primary">{profile.followingCount}</strong> подписок</span>
                  {profile.friendsCount !== undefined && (
                    <span><strong className="text-text-primary">{profile.friendsCount}</strong> друзей</span>
                  )}
                </div>

                {/* Social Actions — только для чужих профилей */}
                {!isOwnProfile && user && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {isBlocked ? (
                      <button
                        onClick={handleUnblockUser}
                        disabled={socialLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-elevated/80 transition-colors disabled:opacity-50"
                      >
                        🔓 Разблокировать
                      </button>
                    ) : (
                      <>
                        {isFriend ? (
                          <>
                            <button
                              onClick={() => router.push(`/profile/chats?userId=${params.id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              💬 Написать
                            </button>
                            <button
                              onClick={handleRemoveFriend}
                              disabled={socialLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50"
                            >
                              👥 Удалить из друзей
                            </button>
                          </>
                        ) : hasPendingRequest ? (
                          <button
                            onClick={handleCancelFriendRequest}
                            disabled={socialLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors disabled:opacity-50"
                          >
                            ⏳ Отменить заявку
                          </button>
                        ) : (
                          <button
                            onClick={handleSendFriendRequest}
                            disabled={socialLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                          >
                            👥 Добавить в друзья
                          </button>
                        )}
                        <button
                          onClick={handleBlockUser}
                          disabled={socialLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-elevated/80 transition-colors disabled:opacity-50"
                        >
                          🚫 Заблокировать
                        </button>
                        <ReportButton
                          targetType="USER"
                          targetId={profile.uuid}
                          targetLabel={`@${profile.username}`}
                          variant="text"
                        />
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Rating & Trust Score */}
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">
                  {profile.rating?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-text-secondary">рейтинг</div>
                <div className="mt-3 flex items-center gap-1 justify-center">
                  <div className="w-16 h-2 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full transition-all"
                      style={{ width: `${profile.trustScore || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{profile.trustScore || 0}%</span>
                </div>
                <div className="text-xs text-text-secondary">доверие</div>
              </div>
            </div>
          </div>

          {/* ===== STATS GRID ===== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.gamesPlayed}</div>
              <div className="text-sm text-text-secondary">🎮 Игр пройдено</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.gamesCreated}</div>
              <div className="text-sm text-text-secondary">📅 Игр создано</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.gamesConducted}</div>
              <div className="text-sm text-text-secondary">🎯 Игр проведено</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.scenariosCreated}</div>
              <div className="text-sm text-text-secondary">📝 Сценариев</div>
            </div>
          </div>

          {/* ===== ACHIEVEMENTS ===== */}
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

          {/* ===== TABS: Activity / Reviews / Teams / Scenarios ===== */}
          <div className="card mb-6">
            <div className="flex border-b border-border mb-4 overflow-x-auto">
              {([
                { key: 'activity' as const, label: '📊 Активность' },
                { key: 'reviews' as const, label: `⭐ Отзывы (${profile.reviewsCount})` },
                { key: 'teams' as const, label: '👥 Команды' },
                { key: 'scenarios' as const, label: '📝 Сценарии' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-3">
                {activity.length === 0 ? (
                  <p className="text-text-secondary text-center py-6">Активность пока отсутствует</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated/50">
                      <div className="text-lg">
                        {ACTIVITY_LABELS[item.type]?.split(' ')[0] || '📌'}
                      </div>
                      <div>
                        <p className="text-sm text-text-primary">
                          {ACTIVITY_LABELS[item.type] || item.type}
                          {item.payload?.name ? `: ${item.payload.name as string}` : ''}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-text-secondary text-center py-6">Отзывов пока нет</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-3 rounded-lg bg-surface-elevated/50">
                      <div className="flex items-center justify-between mb-1">
                        <Link href={`/games/${review.game.id}`} className="text-sm font-medium text-primary hover:text-primary-hover">
                          {review.game.title}
                        </Link>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium text-text-primary">{review.rating}</span>
                        </div>
                      </div>
                      {review.text && (
                        <p className="text-sm text-text-secondary">{review.text}</p>
                      )}
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-3">
                {teams.length === 0 ? (
                  <p className="text-text-secondary text-center py-6">Пользователь не состоит в командах</p>
                ) : (
                  teams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/teams/${team.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {team.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{team.name}</div>
                          <div className="text-xs text-text-secondary">
                            {team._count.members} участников · {team._count.games} игр
                          </div>
                        </div>
                      </div>
                      <span className="text-text-secondary">→</span>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Scenarios Tab */}
            {activeTab === 'scenarios' && (
              <div className="space-y-3">
                {scenarios.length === 0 ? (
                  <p className="text-text-secondary text-center py-6">Сценариев пока нет</p>
                ) : (
                  scenarios.map((scenario) => (
                    <div key={scenario.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50">
                      <div>
                        <div className="font-medium text-text-primary">{scenario.name}</div>
                        <div className="text-xs text-text-secondary">
                          v{scenario.version} · {scenario._count.games} игр · {scenario._count.purchases} покупок
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        scenario.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {scenario.isPublished ? 'Опубликован' : 'Черновик'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ===== ACTIVITY INFO ===== */}
          <div className="card">
            <h2 className="text-xl font-bold text-text-primary mb-4">ℹ️ Информация</h2>
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
