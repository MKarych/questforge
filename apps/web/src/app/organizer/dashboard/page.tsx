'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyGames, getProfile, type Game } from '@/lib/api/client';
import Header from '@/components/ui/Header';

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [gamesResponse, profileResponse] = await Promise.all([
          getMyGames(),
          getProfile(),
        ]);

        setGames(gamesResponse.data.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить данные';
        setError(message);
        // If unauthorized, redirect to login
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const stats = {
    totalGames: games.length,
    activeGames: games.filter((g) => g.status === 'IN_PROGRESS' || g.status === 'STARTED').length,
    totalPlayers: games.reduce((sum, g) => sum + (g.teamsCount || 0), 0),
    totalRevenue: games.reduce((sum, g) => sum + (g.price || 0) * (g.teamsCount || 0), 0),
  };

  const recentGames = games.slice(0, 5).map((game) => ({
    id: game.id,
    title: game.title,
    status: game.status.toLowerCase(),
    teams: game.teamsCount || 0,
    date: game.date,
  }));

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded mb-4 w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-surface rounded" />
              ))}
            </div>
          </div>
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
          <h1 className="text-3xl font-bold text-text-primary">Панель организатора</h1>
          <Link href="/organizer/games/create" className="btn-primary">
            + Создать игру
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="text-3xl font-bold text-primary mb-1">{stats.totalGames}</div>
            <div className="text-sm text-text-secondary">Всего игр</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-success mb-1">{stats.activeGames}</div>
            <div className="text-sm text-text-secondary">Активные</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-warning mb-1">{stats.totalPlayers}</div>
            <div className="text-sm text-text-secondary">Игроков</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-text-primary mb-1">
              {stats.totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-sm text-text-secondary">Доход</div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Мои игры</h2>
            <Link href="/organizer/games" className="text-primary hover:text-primary-hover text-sm font-medium">
              Все игры →
            </Link>
          </div>

          {games.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p className="mb-4">У вас пока нет игр</p>
              <Link href="/organizer/games/create" className="btn-primary">
                + Создать первую игру
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Название</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Статус</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Команд</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Дата</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGames.map((game) => (
                    <tr key={game.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 text-text-primary">{game.title}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          game.status === 'in_progress' || game.status === 'started' ? 'bg-success/10 text-success' :
                          game.status === 'pending' ? 'bg-warning/10 text-warning' :
                          game.status === 'approved' ? 'bg-success/10 text-success' :
                          'bg-surface-elevated text-text-muted'
                        }`}>
                          {game.status === 'in_progress' || game.status === 'started' ? 'Активна' :
                           game.status === 'pending' ? 'На модерации' :
                           game.status === 'approved' ? 'Одобрена' :
                           game.status === 'draft' ? 'Черновик' :
                           game.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{game.teams}</td>
                      <td className="py-3 px-4 text-text-secondary">
                        {new Date(game.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/organizer/games/${game.id}`}
                          className="text-primary hover:text-primary-hover text-sm font-medium"
                        >
                          Управление
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/organizer/scenarios/create" className="card card-hover">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-semibold text-text-primary mb-1">Создать сценарий</h3>
            <p className="text-sm text-text-secondary">
              Разработайте новый сценарий для игры
            </p>
          </Link>
          <Link href="/organizer/games" className="card card-hover">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-text-primary mb-1">Аналитика</h3>
            <p className="text-sm text-text-secondary">
              Посмотрите статистику по играм
            </p>
          </Link>
          <Link href="/organizer/settings" className="card card-hover">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-semibold text-text-primary mb-1">Настройки</h3>
            <p className="text-sm text-text-secondary">
              Управление профилем и выплатами
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
