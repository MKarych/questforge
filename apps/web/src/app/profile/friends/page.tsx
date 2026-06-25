'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';
import { apiClient, type FriendDto, type FriendRequestDto, type BlockedUserDto } from '@/lib/api/client';

type Tab = 'friends' | 'incoming' | 'outgoing' | 'blocked';

export default function FriendsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestDto[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestDto[]>([]);
  const [blocked, setBlocked] = useState<BlockedUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login');
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [friendsRes, requestsRes, blockedRes] = await Promise.allSettled([
          apiClient.getMyFriends(),
          apiClient.getFriendRequests(),
          apiClient.getBlockedUsers(),
        ]);

        if (friendsRes.status === 'fulfilled') setFriends(friendsRes.value.data || []);
        if (requestsRes.status === 'fulfilled') {
          setIncoming(requestsRes.value.data?.incoming || []);
          setOutgoing(requestsRes.value.data?.outgoing || []);
        }
        if (blockedRes.status === 'fulfilled') setBlocked(blockedRes.value.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    if (user) loadAll();
  }, [user]);

  const handleRespond = async (requestId: string, action: 'accepted' | 'rejected') => {
    setActionLoading(requestId);
    try {
      await apiClient.respondToFriendRequest(requestId, action);
      setIncoming(prev => prev.filter(r => r.id !== requestId));
      if (action === 'accepted') {
        // Refresh friends list
        const res = await apiClient.getMyFriends();
        setFriends(res.data || []);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await apiClient.cancelFriendRequest(requestId);
      setOutgoing(prev => prev.filter(r => r.id !== requestId));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    setActionLoading(friendId);
    try {
      await apiClient.removeFriend(friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (userId: string) => {
    setActionLoading(userId);
    try {
      await apiClient.socialUnblockUser(userId);
      setBlocked(prev => prev.filter(b => b.id !== userId));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'friends', label: '👥 Друзья', count: friends.length },
    { key: 'incoming', label: '📩 Входящие', count: incoming.length },
    { key: 'outgoing', label: '📤 Исходящие', count: outgoing.length },
    { key: 'blocked', label: '🚫 Заблокированные', count: blocked.length },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated"
              aria-label="Назад"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-text-primary">Мои друзья</h1>
          </div>

          {/* Tabs */}
          <div className="card mb-6">
            <div className="flex border-b border-border overflow-x-auto">
              {tabs.map(({ key, label, count }) => (
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
                  {count !== undefined && count > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="p-4">
                {/* Friends Tab */}
                {activeTab === 'friends' && (
                  <>
                    {friends.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">👥</div>
                        <p className="text-text-secondary mb-4">У вас пока нет друзей</p>
                        <Link href="/games" className="btn-primary text-sm">
                          Найти игроков
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {friends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors"
                          >
                            <Link href={`/profile/${friend.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                                {friend.avatarUrl ? (
                                  <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm text-primary font-semibold">
                                    {friend.username?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-text-primary truncate">@{friend.username}</div>
                                <div className="text-xs text-text-secondary">
                                  {friend.city || 'Город не указан'} · Друзья с {new Date(friend.friendsSince).toLocaleDateString('ru-RU')}
                                </div>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                href={`/profile/chats?userId=${friend.id}`}
                                className="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                                title="Написать сообщение"
                              >
                                💬
                              </Link>
                              <button
                                onClick={() => handleRemoveFriend(friend.id)}
                                disabled={actionLoading === friend.id}
                                className="p-2 text-text-secondary hover:text-error transition-colors rounded-lg hover:bg-error/10 disabled:opacity-50"
                                title="Удалить из друзей"
                              >
                                {actionLoading === friend.id ? '⏳' : '✕'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Incoming Requests Tab */}
                {activeTab === 'incoming' && (
                  <>
                    {incoming.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">📩</div>
                        <p className="text-text-secondary">Нет входящих заявок</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {incoming.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50"
                          >
                            <Link href={`/profile/${req.sender.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                                {req.sender.avatarUrl ? (
                                  <img src={req.sender.avatarUrl} alt={req.sender.username} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm text-primary font-semibold">
                                    {req.sender.username?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-text-primary truncate">@{req.sender.username}</div>
                                <div className="text-xs text-text-secondary">
                                  {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                                </div>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleRespond(req.id, 'accepted')}
                                disabled={actionLoading === req.id}
                                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === req.id ? '⏳' : '✅ Принять'}
                              </button>
                              <button
                                onClick={() => handleRespond(req.id, 'rejected')}
                                disabled={actionLoading === req.id}
                                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Outgoing Requests Tab */}
                {activeTab === 'outgoing' && (
                  <>
                    {outgoing.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">📤</div>
                        <p className="text-text-secondary">Нет исходящих заявок</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {outgoing.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50"
                          >
                            <Link href={`/profile/${req.receiver.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                                {req.receiver.avatarUrl ? (
                                  <img src={req.receiver.avatarUrl} alt={req.receiver.username} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm text-primary font-semibold">
                                    {req.receiver.username?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-text-primary truncate">@{req.receiver.username}</div>
                                <div className="text-xs text-text-secondary">
                                  Отправлено {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                                </div>
                              </div>
                            </Link>
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              disabled={actionLoading === req.id}
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors disabled:opacity-50 shrink-0"
                            >
                              {actionLoading === req.id ? '⏳' : 'Отменить'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Blocked Users Tab */}
                {activeTab === 'blocked' && (
                  <>
                    {blocked.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">🚫</div>
                        <p className="text-text-secondary">Нет заблокированных пользователей</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {blocked.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm text-primary font-semibold">
                                    {user.username?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-text-primary truncate">@{user.username}</div>
                                <div className="text-xs text-text-secondary">
                                  Заблокирован {new Date(user.blockedAt).toLocaleDateString('ru-RU')}
                                  {user.reason && ` · Причина: ${user.reason}`}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnblock(user.id)}
                              disabled={actionLoading === user.id}
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-elevated/80 transition-colors disabled:opacity-50 shrink-0"
                            >
                              {actionLoading === user.id ? '⏳' : '🔓 Разблокировать'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}