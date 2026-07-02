'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getMyListings,
  publishListing,
  unpublishListing,
  type MarketplaceListingDto,
} from '@/lib/api/client';
import Header from '@/components/ui/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

type ListingStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'BLOCKED';

const statusLabels: Record<ListingStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Черновик', className: 'bg-surface-elevated text-text-muted' },
  PENDING: { label: 'На модерации', className: 'bg-warning/10 text-warning' },
  PUBLISHED: { label: 'Опубликован', className: 'bg-success/10 text-success' },
  REJECTED: { label: 'Отклонён', className: 'bg-error/10 text-error' },
  BLOCKED: { label: 'Заблокирован', className: 'bg-error/10 text-error' },
};

function ListingStatusBadge({ status }: { status: string }) {
  const config = statusLabels[status as ListingStatus] ?? {
    label: status,
    className: 'bg-surface-elevated text-text-secondary',
  };

  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyListings();
      setListings(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить листинги';
      setError(message);
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handlePublish = async (id: string) => {
    try {
      setActionLoading(id);
      await publishListing(id);
      await loadListings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось отправить на модерацию';
      alert(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      setActionLoading(id);
      await unpublishListing(id);
      await loadListings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось снять с публикации';
      alert(message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" className="py-12" />
        </div>
      </div>
    );
  }

  if (error && !listings.length) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <Link href="/auth/login" className="btn-primary">
              Войти
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Мои листинги</h1>
            <p className="text-text-secondary">
              Управление публикациями сценариев в маркетплейсе
            </p>
          </div>
          <Link href="/marketplace/create" className="btn-primary">
            + Создать листинг
          </Link>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon="📦"
            title="У вас ещё нет листингов"
            description="Создайте первый листинг и начните продавать свои сценарии"
            ctaText="Создать листинг"
            ctaLink="/marketplace/create"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {listings.map((listing) => (
              <div key={listing.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary truncate">
                        {listing.title}
                      </h3>
                      <ListingStatusBadge status={listing.status} />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-secondary mb-3 flex-wrap">
                      <span className="font-medium text-text-primary">
                        {formatPrice(listing.price)}
                      </span>
                      <span>{listing.category}</span>
                      {listing.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          {listing.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-0.5 bg-surface-elevated rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        📜 {listing.scenario.name} v{listing.scenario.version}
                      </span>
                    </div>

                    {/* Статистика */}
                    <div className="flex items-center gap-5 text-sm text-text-secondary flex-wrap">
                      <span className="flex items-center gap-1" title="Просмотры">
                        👁 {listing.views}
                      </span>
                      <span className="flex items-center gap-1" title="Продажи">
                        🛒 {listing.sales}
                      </span>
                      <span className="flex items-center gap-1" title="Избранное">
                        ♥ {listing.favorites}
                      </span>
                      <span className="flex items-center gap-1" title="Рейтинг">
                        ★ {listing.avgRating > 0 ? listing.avgRating.toFixed(1) : '—'}
                      </span>
                      <span className="flex items-center gap-1" title="Отзывы">
                        💬 {listing.reviewsCount}
                      </span>
                    </div>

                    {/* Комментарий модератора для отклонённых */}
                    {listing.status === 'REJECTED' && (
                      <div className="mt-3 p-3 bg-error/5 border border-error/20 rounded-lg">
                        <p className="text-sm text-error">
                          <span className="font-medium">Причина отклонения:</span>{' '}
                          {(listing as any).moderationComment || 'Не указана'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    {listing.status === 'DRAFT' && (
                      <>
                        <Link
                          href={`/marketplace/edit/${listing.id}`}
                          className="btn-secondary text-sm"
                        >
                          Редактировать
                        </Link>
                        <button
                          onClick={() => handlePublish(listing.id)}
                          disabled={actionLoading === listing.id}
                          className="btn-primary text-sm"
                        >
                          {actionLoading === listing.id ? '...' : 'Отправить на модерацию'}
                        </button>
                      </>
                    )}

                    {listing.status === 'PENDING' && (
                      <Link
                        href={`/marketplace/edit/${listing.id}`}
                        className="btn-secondary text-sm"
                      >
                        Редактировать
                      </Link>
                    )}

                    {listing.status === 'PUBLISHED' && (
                      <>
                        <Link
                          href={`/marketplace/edit/${listing.id}`}
                          className="btn-secondary text-sm"
                        >
                          Редактировать
                        </Link>
                        <button
                          onClick={() => handleUnpublish(listing.id)}
                          disabled={actionLoading === listing.id}
                          className="btn-outline text-sm text-warning border-warning/30 hover:bg-warning/5"
                        >
                          {actionLoading === listing.id ? '...' : 'Снять с публикации'}
                        </button>
                      </>
                    )}

                    {(listing.status === 'REJECTED' || listing.status === 'BLOCKED') && (
                      <Link
                        href={`/marketplace/edit/${listing.id}`}
                        className="btn-secondary text-sm"
                      >
                        Редактировать
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}