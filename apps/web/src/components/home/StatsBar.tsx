'use client';

import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { StatsSkeleton } from '@/components/ui/Skeleton';

interface StatsBarProps {
  stats: {
    games: number;
    teams: number;
    players: number;
    cities: number;
    organizers: number;
  } | null;
  loading?: boolean;
}

function StatsContent({ stats }: { stats: StatsBarProps['stats'] }) {
  if (!stats) return null;

  const items = [
    { value: stats.games, label: 'игр', icon: '🎮' },
    { value: stats.teams, label: 'команд', icon: '👥' },
    { value: stats.players, label: 'игроков', icon: '👤' },
    { value: stats.cities, label: 'городов', icon: '📍' },
    { value: stats.organizers, label: 'организаторов', icon: '🏆' },
  ];

  return (
    <section className="mb-16">
      <div className="flex flex-wrap justify-center gap-4 md:gap-8">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center bg-surface border border-border rounded-xl px-6 py-4 min-w-[120px]"
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-2xl md:text-3xl font-bold text-primary">
              {item.value.toLocaleString('ru-RU')}+
            </span>
            <span className="text-sm text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StatsBar(props: StatsBarProps) {
  if (props.loading) return <StatsSkeleton />;

  return (
    <ErrorBoundary blockName="Статистика">
      <StatsContent stats={props.stats} />
    </ErrorBoundary>
  );
}