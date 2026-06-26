'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { getUserTeams } from '@/lib/api/client';

interface TeamItem {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  memberCount: number;
  role: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserTeams('me');
      setTeams(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки команд');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const roleLabels: Record<string, string> = {
    CAPTAIN: 'Капитан',
    CO_CAPTAIN: 'Сокапитан',
    MEMBER: 'Участник',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/profile" className="hover:text-primary">Профиль</Link>
          <span>/</span>
          <span className="text-text-primary">Команды</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Мои команды</h1>
          <Link
            href="/teams/create"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
          >
            Создать команду
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={loadTeams} className="text-primary hover:underline text-sm">
              Попробовать снова
            </button>
          </div>
        ) : teams.length === 0 ? (
          <EmptyState
            icon="👥"
            title="У вас пока нет команд"
            description="Создайте команду или присоединитесь к существующей"
            ctaText="Создать команду"
            ctaLink="/teams/create"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`} className="card card-hover p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0 overflow-hidden">
                    {team.avatar ? (
                      <img src={team.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      team.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{team.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-secondary">{team.memberCount} участников</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                        {roleLabels[team.role] || team.role}
                      </span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}