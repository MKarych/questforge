import Link from 'next/link';

interface EmptyStateProps {
  icon: string;
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  onCtaClick?: () => void;
}

export default function EmptyState({
  icon,
  title = 'Пока пусто',
  description = 'Будьте первыми!',
  ctaText,
  ctaLink,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className="card text-center py-12">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-6">{description}</p>
      {ctaText && (ctaLink || onCtaClick) && (
        ctaLink ? (
          <Link href={ctaLink} className="btn-primary inline-flex">
            {ctaText}
          </Link>
        ) : (
          <button onClick={onCtaClick} className="btn-primary">
            {ctaText}
          </button>
        )
      )}
    </div>
  );
}

// Predefined empty states
export function EmptyGamesState() {
  return (
    <EmptyState
      icon="🎮"
      title="Игр пока нет"
      description="Будьте первыми, кто создаст игру!"
      ctaText="Создать игру"
      ctaLink="/organizer/games/create"
    />
  );
}

export function EmptyTeamsState() {
  return (
    <EmptyState
      icon="👥"
      title="Команд пока нет"
      description="Создайте свою команду и пригласите друзей!"
      ctaText="Создать команду"
      ctaLink="/teams/create"
    />
  );
}

export function EmptyReviewsState() {
  return (
    <EmptyState
      icon="⭐"
      title="Отзывов пока нет"
      description="Будьте первыми, кто оставит отзыв!"
    />
  );
}

export function EmptyOrganizersState() {
  return (
    <EmptyState
      icon="🏆"
      title="Организаторов пока нет"
      description="Станьте первым организатором!"
      ctaText="Стать организатором"
      ctaLink="/organizer"
    />
  );
}

export function EmptyWinnersState() {
  return (
    <EmptyState
      icon="🥇"
      title="Победителей пока нет"
      description="Участвуйте в играх и побеждайте!"
      ctaText="Выбрать игру"
      ctaLink="/games"
    />
  );
}

export function EmptySearchState({ query }: { query: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="Ничего не найдено"
      description={`По запросу «${query}» ничего не найдено. Попробуйте изменить запрос.`}
    />
  );
}