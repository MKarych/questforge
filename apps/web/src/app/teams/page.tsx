'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTeams, type Team } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import Image from 'next/image';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активна',
  RECRUITING: 'Набирает',
  INACTIVE: 'Неактивна',
  ARCHIVED: 'В архиве',
  DELETED: 'Удалена',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  RECRUITING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  INACTIVE: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ARCHIVED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  DELETED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  useEffect(() => {
    async function loadTeams() {
      try {
        const params: { city?: string; limit: number; offset: number } = { limit, offset };
        if (cityFilter) params.city = cityFilter;
        const response = await getTeams(params);
        setTeams(response.data?.items || []);
        setTotal(response.data?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить команды');
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, [cityFilter, offset]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

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

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <input
            type="text"
            placeholder="Фильтр по городу..."
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setOffset(0);
            }}
            className="input max-w-xs"
          />
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-surface-elevated rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-surface-elevated rounded w-3/4 mb-2" />
                    <div className="h-3 bg-surface-elevated rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-surface-elevated rounded mb-2 w-full" />
                <div className="h-4 bg-surface-elevated rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card border border-red-500/20 bg-red-500/5">
            <p className="text-red-400">{error}</p>
          </div>
        ) : !teams || teams.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-text-secondary mb-4">
              {cityFilter ? 'Команды в этом городе не найдены' : 'Команд пока нет'}
            </p>
            {!cityFilter && (
              <Link href="/teams/create" className="btn-primary">
                Создать первую команду
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="card hover:border-primary transition-colors group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-surface-elevated flex-shrink-0 overflow-hidden">
                      {team.avatar ? (
                        <Image
                          src={team.avatar}
                          alt={team.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-text-secondary">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                          {team.name}
                        </h3>
                        <span className="text-xs text-text-secondary whitespace-nowrap">
                          {team.membersCount} уч.
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[team.status] || STATUS_COLORS.ACTIVE}`}>
                          {STATUS_LABELS[team.status] || team.status}
                        </span>
                        {team.city && (
                          <span className="text-xs text-text-secondary">📍 {team.city}</span>
                        )}
                      </div>
                    </div>
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
                  {team.tags && team.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {team.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-surface-elevated rounded-full text-text-secondary"
                        >
                          #{tag}
                        </span>
                      ))}
                      {team.tags.length > 3 && (
                        <span className="text-xs text-text-secondary">
                          +{team.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      Создана: {new Date(team.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <span className="text-xs text-primary font-medium">
                      Подробнее →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Назад
                </button>
                <span className="text-sm text-text-secondary px-4">
                  Страница {currentPage} из {totalPages}
                </span>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
