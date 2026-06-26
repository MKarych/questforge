'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { getFollowers, getFollowing, followUser, unfollowUser } from '@/lib/api/client';

interface UserItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  followedAt: string;
}

export default function FollowingPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [totalFollowing, setTotalFollowing] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const id = userId || 'me';
      const [followersRes, followingRes] = await Promise.all([
        getFollowers(id),
        getFollowing(id),
      ]);
      setFollowers(followersRes.data?.data || followersRes.data || []);
      setTotalFollowers(followersRes.data?.meta?.total || 0);
      setFollowing(followingRes.data?.data || followingRes.data || []);
      setTotalFollowing(followingRes.data?.meta?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Ошибка');
    }
  };

  const items = activeTab === 'followers' ? followers : following;
  const total = activeTab === 'followers' ? totalFollowers : totalFollowing;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/profile" className="hover:text-primary">Профиль</Link>
          <span>/</span>
          <span className="text-text-primary">Подписки</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-6">Подписки</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-secondary rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'followers'
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Подписчики ({totalFollowers})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'following'
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Подписки ({totalFollowing})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={loadData} className="text-primary hover:underline text-sm">
              Попробовать снова
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="👥"
            title={activeTab === 'followers' ? 'Подписчиков пока нет' : 'Вы ни на кого не подписаны'}
            description={activeTab === 'followers' ? 'Когда кто-то подпишется, он появится здесь' : 'Найдите интересных авторов в каталоге'}
            ctaText="В каталог"
            ctaLink="/marketplace"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((user) => (
              <div key={user.id} className="card p-4 flex items-center justify-between">
                <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary shrink-0 overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                    <p className="text-xs text-text-secondary/60">
                      {new Date(user.followedAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}