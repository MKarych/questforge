'use client';

import Link from 'next/link';
import type { GameCard } from '@/lib/api/client';
import GameCardComponent from '@/components/ui/GameCard';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { GamesGridSkeleton, SectionHeaderSkeleton } from '@/components/ui/Skeleton';
import { EmptyGamesState } from '@/components/ui/EmptyState';

interface GamesSectionProps {
  title: string;
  link: string;
  games: GameCard[] | null;
  loading?: boolean;
  error?: string | null;
}

function GamesContent({ title, link, games }: { title: string; link: string; games: GameCard[] }) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">{title}</h2>
        <Link href={link} className="text-primary hover:text-primary-hover font-medium text-sm">
          Смотреть все →
        </Link>
      </div>

      {games.length === 0 ? (
        <EmptyGamesState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <GameCardComponent key={game.id} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function GamesSection(props: GamesSectionProps) {
  if (props.loading) {
    return (
      <section className="mb-12">
        <SectionHeaderSkeleton />
        <GamesGridSkeleton count={4} />
      </section>
    );
  }

  if (props.error) {
    return (
      <ErrorBoundary blockName={props.title}>
        <div />
      </ErrorBoundary>
    );
  }

  if (!props.games) return null;

  return (
    <ErrorBoundary blockName={props.title}>
      <GamesContent title={props.title} link={props.link} games={props.games} />
    </ErrorBoundary>
  );
}