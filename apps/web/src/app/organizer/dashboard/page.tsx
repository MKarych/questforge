'use client';

import Link from 'next/link';
import Header from '@/components/ui/Header';

export default function OrganizerDashboardPage() {
  // Mock data for demonstration
  const stats = {
    totalGames: 5,
    activeGames: 2,
    totalPlayers: 127,
    totalRevenue: 15900,
  };

  const recentGames = [
    { id: '1', title: 'Тайны старого города', status: 'active', teams: 8, date: '2025-01-15' },
    { id: '2', title: 'Ночной квест', status: 'draft', teams: 0, date: '2025-02-01' },
    { id: '3', title: 'Исторический маршрут', status: 'pending', teams: 0, date: '2025-01-20' },
  ];

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
                        game.status === 'active' ? 'bg-success/10 text-success' :
                        game.status === 'pending' ? 'bg-warning/10 text-warning' :
                        'bg-surface-elevated text-text-muted'
                      }`}>
                        {game.status === 'active' ? 'Активна' :
                         game.status === 'pending' ? 'На модерации' :
                         'Черновик'}
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
