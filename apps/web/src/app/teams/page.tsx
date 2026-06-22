'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTeams, type Team } from '@/lib/api/client';
import Header from '@/components/ui/Header';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await getTeams({ limit: 50 });
        setTeams(response.data?.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить команды');
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Команды</h1>
            <p className="text-text-secondary mt-1">
              Найдите команду для участия в играх или создайте свою
            </p>
          </div>
          <Link href="/teams/create" className="btn-primary">
            Создать команду
          </Link>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-surface-elevated rounded mb-4 w-3/4" />
                <div className="h-4 bg-surface-elevated rounded mb-2 w-full" />
                <div className="h-4 bg-surface-elevated rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card border-error">
            <p className="text-error">{error}</p>
          </div>
        ) : !teams || teams.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-text-secondary mb-4">Команд пока нет</p>
            <Link href="/teams/create" className="btn-primary">
              Создать первую команду
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="card hover:border-primary transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {team.name}
                  </h3>
                  <span className="text-xs text-text-secondary">
                    {team.membersCount} уч.
                  </span>
                </div>
                {team.description && (
                  <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <div className="flex items-center gap-1">
                    <span>Капитан:</span>
                    <span className="text-text-primary">{team.captain.name}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    Рейтинг: {team.rating || '—'}
                  </span>
                  <span className="text-xs text-primary font-medium">
                    Подробнее →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
