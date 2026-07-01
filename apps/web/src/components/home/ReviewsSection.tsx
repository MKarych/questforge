'use client';

import type { ReviewCard } from '@/lib/api/client';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { EmptyReviewsState } from '@/components/ui/EmptyState';

interface ReviewsSectionProps {
  reviews: ReviewCard[] | null;
  loading?: boolean;
}

function ReviewsContent({ reviews }: { reviews: ReviewCard[] }) {
  if (reviews.length === 0) return <EmptyReviewsState />;

  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-6">
        ⭐ Последние отзывы
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="card">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < review.rating ? 'text-warning fill-current' : 'text-text-muted'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-text-secondary mb-3 line-clamp-3">
              &laquo;{review.text}&raquo;
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {review.user.avatarUrl ? (
                  <img src={review.user.avatarUrl} alt={review.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-primary font-semibold">
                    {review.user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted">{review.user.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ReviewsSection(props: ReviewsSectionProps) {
  if (props.loading) {
    return (
      <section className="mb-12">
        <div className="h-7 w-48 bg-surface-elevated rounded animate-pulse mb-6" />
        <ListSkeleton count={2} />
      </section>
    );
  }

  if (!props.reviews) return null;

  return (
    <ErrorBoundary blockName="Отзывы">
      <ReviewsContent reviews={props.reviews} />
    </ErrorBoundary>
  );
}