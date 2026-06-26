'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { getUserAchievements, checkAchievements } from '@/lib/api/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserAchievements('me');
      setAchievements(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки достижений');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const handleCheckAchievements = async () => {
    setChecking(true);
    try {
      await checkAchievements();
      await loadAchievements();
    } catch (err: any) {
      alert(err?.message || 'Ошибка проверки достижений');
    } finally {
      setChecking(false);
    }
  };

  const unlocked = achievements.filter((a) => a.unlockedAt);
  const locked = achievements.filter((a) => !a.unlockedAt);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/profile" className="hover:text-primary">Профиль</Link>
          <span>/</span>
          <span className="text-text-primary">Достижения</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Достижения</h1>
          <button
            onClick={handleCheckAchievements}
            disabled={checking}
            className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {checking ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            Проверить новые
          </button>
        </div>

        {/* Stats */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-lg font-bold text-text-primary">
                {unlocked.length} / {achievements.length}
              </p>
              <p className="text-sm text-text-secondary">Достижений получено</p>
            </div>
            <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden max-w-xs ml-auto">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={loadAchievements} className="text-primary hover:underline text-sm">
              Попробовать снова
            </button>
          </div>
        ) : achievements.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="Достижений пока нет"
            description="Начните играть и создавать, чтобы получать достижения"
          />
        ) : (
          <div>
            {/* Unlocked */}
            {unlocked.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Получено ({unlocked.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unlocked.map((achievement) => (
                    <div key={achievement.id} className="card p-4 border border-green-500/20">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{achievement.name}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{achievement.description}</p>
                          <p className="text-[10px] text-green-400 mt-1">
                            Получено: {new Date(achievement.unlockedAt!).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked */}
            {locked.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Ещё не получено ({locked.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {locked.map((achievement) => (
                    <div key={achievement.id} className="card p-4 opacity-60">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl grayscale">{achievement.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{achievement.name}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{achievement.description}</p>
                          {achievement.maxProgress > 0 && (
                            <div className="mt-2">
                              <div className="flex justify-between text-[10px] text-text-secondary mb-0.5">
                                <span>Прогресс</span>
                                <span>{achievement.progress}/{achievement.maxProgress}</span>
                              </div>
                              <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary/50 rounded-full"
                                  style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}