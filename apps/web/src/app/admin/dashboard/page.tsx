'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminStats {
  totalUsers: number;
  totalOrganizers: number;
  totalGames: number;
  activeGames: number;
  totalScenarios: number;
  pendingGames: number;
  pendingApplications: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const profileResponse = await getProfile();
        const role = profileResponse.data.role;
        setUserRole(role);

        if (role !== 'ADMIN' && role !== 'MODERATOR') {
          router.push('/');
          return;
        }

        const statsResponse = await apiClient.getAdminStats();
        setStats(statsResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

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

  if (error || !stats) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-error mb-4">{error || 'Нет данных'}</p>
            <Link href="/" className="btn-primary">На главную</Link>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">🔐 Админ-панель</h1>
          <span className="text-sm text-text-secondary">
            {isAdmin ? 'Администратор' : 'Модератор'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium"
          >
            📊 Дашборд
          </Link>
          <Link
            href="/admin/games/pending"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            🎮 Модерация игр
          </Link>
          <Link
            href="/admin/organizers/applications"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            📋 Заявки организаторов
          </Link>
          {isAdmin && (
            <Link
              href="/admin/users"
              className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
            >
              👥 Пользователи
            </Link>
          )}
          <Link
            href="/admin/teams"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            👥 Команды
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="text-3xl font-bold text-primary mb-1">{stats.totalUsers}</div>
            <div className="text-sm text-text-secondary">Всего пользователей</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-warning mb-1">{stats.totalOrganizers}</div>
            <div className="text-sm text-text-secondary">Организаторов</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-success mb-1">{stats.totalGames}</div>
            <div className="text-sm text-text-secondary">Всего игр</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-primary mb-1">{stats.activeGames}</div>
            <div className="text-sm text-text-secondary">Активных игр</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-text-primary mb-1">{stats.totalScenarios}</div>
            <div className="text-sm text-text-secondary">Сценариев</div>
          </div>
          <div className={`card ${stats.pendingGames > 0 ? 'border-error' : ''}`}>
            <div className={`text-3xl font-bold mb-1 ${stats.pendingGames > 0 ? 'text-error' : 'text-text-primary'}`}>
              {stats.pendingGames}
            </div>
            <div className="text-sm text-text-secondary">
              {stats.pendingGames > 0 ? '🔴 Игр на модерации' : 'Игр на модерации'}
            </div>
            {stats.pendingGames > 0 && (
              <Link href="/admin/games/pending" className="text-xs text-primary hover:underline mt-1 inline-block">
                Перейти к модерации →
              </Link>
            )}
          </div>
          <div className={`card ${stats.pendingApplications > 0 ? 'border-warning' : ''}`}>
            <div className={`text-3xl font-bold mb-1 ${stats.pendingApplications > 0 ? 'text-warning' : 'text-text-primary'}`}>
              {stats.pendingApplications}
            </div>
            <div className="text-sm text-text-secondary">
              {stats.pendingApplications > 0 ? '🟡 Заявок на рассмотрении' : 'Заявок организаторов'}
            </div>
            {stats.pendingApplications > 0 && (
              <Link href="/admin/organizers/applications" className="text-xs text-primary hover:underline mt-1 inline-block">
                Перейти к заявкам →
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/games/pending" className="card card-hover">
            <div className="text-3xl mb-3">🎮</div>
            <h3 className="font-semibold text-text-primary mb-1">Модерация игр</h3>
            <p className="text-sm text-text-secondary">
              {stats.pendingGames > 0
                ? `${stats.pendingGames} игр${stats.pendingGames === 1 ? 'а' : 'ы'} ожидает проверки`
                : 'Нет игр на проверке'}
            </p>
          </Link>
          <Link href="/admin/organizers/applications" className="card card-hover">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-text-primary mb-1">Заявки организаторов</h3>
            <p className="text-sm text-text-secondary">
              {stats.pendingApplications > 0
                ? `${stats.pendingApplications} заяв${stats.pendingApplications === 1 ? 'ка' : 'ки'} ожидает рассмотрения`
                : 'Нет заявок на рассмотрении'}
            </p>
          </Link>
          {isAdmin && (
            <Link href="/admin/users" className="card card-hover">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-semibold text-text-primary mb-1">Пользователи</h3>
              <p className="text-sm text-text-secondary">
                Управление пользователями и ролями
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}