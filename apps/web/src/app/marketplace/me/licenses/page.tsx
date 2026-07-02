'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyLicenses } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

interface LicenseItem {
  id: string;
  licenseType: string;
  status: string;
  maxRuns: number | null;
  usedRuns: number;
  expiresAt: string | null;
  isLifetime: boolean;
  version: number;
  createdAt: string;
  listing: {
    title: string;
  };
}

const licenseTypeLabels: Record<string, string> = {
  SINGLE: 'Single',
  MULTI_CITY: 'Multi City',
  COMMERCIAL: 'Commercial',
  WHITE_LABEL: 'White Label',
};

const licenseStatusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Активна', className: 'bg-success/10 text-success' },
  EXPIRED: { label: 'Истекла', className: 'bg-surface-elevated text-text-muted' },
  REVOKED: { label: 'Отозвана', className: 'bg-error/10 text-error' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function MyLicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLicenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyLicenses();
      setLicenses(response.data as unknown as LicenseItem[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить лицензии';
      setError(message);
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

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

  if (error && !licenses.length) {
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
          <h1 className="text-3xl font-bold text-text-primary mb-2">Мои лицензии</h1>
          <p className="text-text-secondary">
            Все приобретённые лицензии на сценарии
          </p>
        </div>

        {licenses.length === 0 ? (
          <EmptyState
            icon="🔑"
            title="У вас ещё нет лицензий"
            description="Приобретите сценарий в маркетплейсе, чтобы получить лицензию на его использование"
            ctaText="Перейти в маркетплейс"
            ctaLink="/marketplace"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {licenses.map((license) => (
              <div key={license.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {license.listing.title}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          licenseStatusConfig[license.status]?.className ??
                          'bg-surface-elevated text-text-secondary'
                        }`}
                      >
                        {licenseStatusConfig[license.status]?.label ?? license.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-5 text-sm text-text-secondary flex-wrap">
                      <span>
                        Тип:{' '}
                        <span className="font-medium text-text-primary">
                          {licenseTypeLabels[license.licenseType] || license.licenseType}
                        </span>
                      </span>

                      <span>
                        Запуски:{' '}
                        <span className="font-medium text-text-primary">
                          {license.maxRuns !== null
                            ? `${license.usedRuns}/${license.maxRuns}`
                            : '∞'}
                        </span>
                      </span>

                      <span>
                        Срок:{' '}
                        <span className="font-medium text-text-primary">
                          {license.isLifetime ? 'Бессрочно' : `до ${formatDate(license.expiresAt)}`}
                        </span>
                      </span>

                      <span>
                        Версия:{' '}
                        <span className="font-medium text-text-primary">
                          v{license.version}
                        </span>
                      </span>

                      <span>
                        Приобретена:{' '}
                        <span className="font-medium text-text-primary">
                          {formatDate(license.createdAt)}
                        </span>
                      </span>
                    </div>
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