'use client';

import Link from 'next/link';
import type { OrganizerCard } from '@/lib/api/client';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyOrganizersState } from '@/components/ui/EmptyState';

interface OrganizersSectionProps {
  organizers: OrganizerCard[] | null;
  loading?: boolean;
}

function OrganizersContent({ organizers }: { organizers: OrganizerCard[] }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-6">
        🏆 Лучшие организаторы
      </h2>

      {organizers.length === 0 ? (
        <EmptyOrganizersState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {organizers.map((org) => (
            <Link
              key={org.id}
              href={`/profile/${org.id}`}
              className="card-hover flex items-center gap-4 p-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {org.avatarUrl ? (
                  <img src={org.avatarUrl} alt={org.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg text-primary font-semibold">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text-primary truncate">{org.name}</h3>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                  <span>★ {org.rating.toFixed(1)}</span>
                  <span>{org.gamesCount} игр</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default function OrganizersSection(props: OrganizersSectionProps) {
  if (props.loading) {
    return (
      <section className="mb-12">
        <div className="h-7 w-64 bg-surface-elevated rounded animate-pulse mb-6" />
        <ListSkeleton count={4} />
      </section>
    );
  }

  if (!props.organizers) return null;

  return (
    <ErrorBoundary blockName="Организаторы">
      <OrganizersContent organizers={props.organizers} />
    </ErrorBoundary>
  );
}