'use client';

import Link from 'next/link';
import type { WinnerCard } from '@/lib/api/client';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { EmptyWinnersState } from '@/components/ui/EmptyState';

interface WinnersSectionProps {
  winners: WinnerCard[] | null;
  loading?: boolean;
}

function WinnersContent({ winners }: { winners: WinnerCard[] }) {
  if (winners.length === 0) return <EmptyWinnersState />;

  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-6">
        🥇 Последние победители
      </h2>

      <div className="space-y-3">
        {winners.map((winner, index) => (
          <Link
            key={`${winner.teamName}-${winner.gameId}`}
            href={`/games/${winner.gameId}`}
            className="card-hover flex items-center gap-4 p-4"
          >
            <span className="text-2xl">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Команда <span className="text-primary">&laquo;{winner.teamName}&raquo;</span>
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Игра &laquo;{winner.gameName}&raquo;
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function WinnersSection(props: WinnersSectionProps) {
  if (props.loading) {
    return (
      <section className="mb-12">
        <div className="h-7 w-56 bg-surface-elevated rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card flex items-center gap-4 p-4 animate-pulse">
              <div className="w-8 h-8 bg-surface-elevated rounded" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-surface-elevated rounded w-2/3" />
                <div className="h-3 bg-surface-elevated rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!props.winners) return null;

  return (
    <ErrorBoundary blockName="Победители">
      <WinnersContent winners={props.winners} />
    </ErrorBoundary>
  );
}