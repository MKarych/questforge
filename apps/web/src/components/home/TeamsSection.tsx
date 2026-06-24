'use client';

import Link from 'next/link';
import type { TeamCard } from '@/lib/api/client';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyTeamsState } from '@/components/ui/EmptyState';

interface TeamsSectionProps {
  teams: TeamCard[] | null;
  loading?: boolean;
}

function TeamsContent({ teams }: { teams: TeamCard[] }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-6">
        🏆 Лучшие команды
      </h2>

      {teams.length === 0 ? (
        <EmptyTeamsState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="card-hover flex items-center gap-4 p-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {team.avatar ? (
                  <img src={team.avatar} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg text-primary font-semibold">
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-text-primary truncate">{team.name}</h3>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                  <span>★ {team.rating}</span>
                  <span>{team.wins} побед</span>
                  <span>{team.membersCount} уч.</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default function TeamsSection(props: TeamsSectionProps) {
  if (props.loading) {
    return (
      <section className="mb-12">
        <div className="h-7 w-48 bg-surface-elevated rounded animate-pulse mb-6" />
        <ListSkeleton count={4} />
      </section>
    );
  }

  if (!props.teams) return null;

  return (
    <ErrorBoundary blockName="Команды">
      <TeamsContent teams={props.teams} />
    </ErrorBoundary>
  );
}