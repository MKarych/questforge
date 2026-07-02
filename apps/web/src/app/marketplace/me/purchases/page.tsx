'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyPurchases } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

interface PurchaseItem {
  id: string;
  listingId: string;
  listingSnapshotPrice: number;
  licenseType: string;
  licenseStatus: string;
  createdAt: string;
  listing: {
    title: string;
    scenarioId: string;
  };
  hasReview: boolean;
}

interface PurchasesResponse {
  items: PurchaseItem[];
  total: number;
  limit: number;
  offset: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const licenseTypeLabels: Record<string, string> = {
  SINGLE: 'Single',
  MULTI_CITY: 'Multi City',
  COMMERCIAL: 'Commercial',
  WHITE_LABEL: 'White Label',
};

const licenseStatusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Активна', className: 'bg-success/10 text-success' },
  REVOKED: { label: 'Отозвана', className: 'bg-error/10 text-error' },
};

export default function MyPurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPurchases = useCallback(async (currentOffset: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyPurchases({ limit: 10, offset: currentOffset });
      const data = response.data as unknown as PurchasesResponse;
      setPurchases(data.items);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить покупки';
      setError(message);
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPurchases(offset);
  }, [offset, loadPurchases]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handlePageChange = (page: number) => {
    setOffset((page - 1) * limit);
  };

  if (loading && purchases.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" className="py-12" />
        </div>
      </div>
    );
  }

  if (error && purchases.length === 0) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Мои покупки</h1>
          <p className="text-text-secondary">
            Все приобретённые сценарии и лицензии
          </p>
        </div>

        {purchases.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="У вас ещё нет покупок"
            description="Приобретите сценарий в маркетплейсе, чтобы использовать его в своих играх"
            ctaText="Перейти в маркетплейс"
            ctaLink="/marketplace"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {purchase.listing.title}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-text-secondary mb-3 flex-wrap">
                        <span className="font-medium text-text-primary">
                          {formatPrice(purchase.listingSnapshotPrice)}
                        </span>
                        <span>
                          {licenseTypeLabels[purchase.licenseType] || purchase.licenseType}
                        </span>
                        <span>
                          {formatDate(purchase.createdAt)}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            licenseStatusConfig[purchase.licenseStatus]?.className ??
                            'bg-surface-elevated text-text-secondary'
                          }`}
                        >
                          {licenseStatusConfig[purchase.licenseStatus]?.label ?? purchase.licenseStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Link
                        href={`/organizer/games/create?scenarioId=${purchase.listing.scenarioId}`}
                        className="btn-primary text-sm"
                      >
                        Создать игру
                      </Link>
                      {!purchase.hasReview && (
                        <Link
                          href={`/marketplace/${purchase.listingId}`}
                          className="btn-secondary text-sm"
                        >
                          Написать отзыв
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  ← Назад
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`text-sm px-3 py-1.5 rounded ${
                      page === currentPage
                        ? 'bg-primary text-white'
                        : 'btn-secondary'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
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