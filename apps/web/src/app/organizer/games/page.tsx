'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyGames, type Game } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MyGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        const response = await getMyGames();
        setGames(response.data.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить игры';
        setError(message);
        // If unauthorized, redirect to login
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" className="py-12" />
        </div>
      </div>
    );
  }

  if (error && !games.length) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <Link href="/auth/login" className="btn-primary">
              Войти
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Мои игры</h1>
            <p className="text-text-secondary">
              Управление созданными играми
            </p>
          </div>
          <Link href="/organizer/games/create" className="btn-primary">
            + Создать игру
          </Link>
        </div>

        {games.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Игр пока нет
            </h3>
            <p className="text-text-secondary mb-6">
              Создайте свою первую игру и начните проводить квесты
            </p>
            <Link href="/organizer/games/create" className="btn-primary">
              Создать игру
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {games.map((game) => (
              <div key={game.id} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {game.title}
                      </h3>
                      <StatusBadge status={game.status} />
                    </div>
                    <div className="flex items-center gap-6 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {game.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {game.teamsCount || 0} команд
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(game.date).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-text-muted">
                      {game.scenarioId ? '📜 Сценарий привязан' : '📜 Сценарий не привязан'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/organizer/games/${game.id}`}
                      className="btn-secondary text-sm"
                    >
                      Редактировать
                    </Link>
                    <button className="text-error hover:text-error/80 text-sm font-medium">
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
