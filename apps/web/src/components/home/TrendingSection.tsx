'use client';

import Link from 'next/link';
import type { GameCard } from '@/lib/api/client';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ListSkeleton } from '@/components/ui/Skeleton';

interface TrendingSectionProps {
  games: GameCard[] | null;
  loading?: boolean;
}

function TrendingContent({ games }: { games: GameCard[] }) {
  if (games.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">🔥</span>
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">Популярно сейчас</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {games.slice(0, 3).map((game, index) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="card-hover flex items-center gap-4 p-4"
          >
            <span className="text-2xl font-bold text-primary shrink-0">
              #{index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {game.title}
              </h3>
              <p className="text-xs text-text-muted truncate">{game.city}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function TrendingSection(props: TrendingSectionProps) {
  if (props.loading) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl">🔥</span>
          <div className="h-7 w-48 bg-surface-elevated rounded animate-pulse" />
        </div>
        <ListSkeleton count={3} />
      </section>
    );
  }

  if (!props.games) return null;

  return (
    <ErrorBoundary blockName="Тренды">
      <TrendingContent games={props.games} />
    </ErrorBoundary>
  );
}