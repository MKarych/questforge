'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  getMyAnalytics,
  getMyAnalyticsSummary,
  getMyEarningsHistory,
  getUnansweredQuestionsCount,
  type User,
  getProfile,
} from '@/lib/api/client';

// ==================== Types ====================

interface AnalyticsSummary {
  totalListings: number;
  totalSales: number;
  totalRevenue: number;
  avgRating: number;
}

interface PeriodStats {
  views: number;
  sales: number;
  revenue: number;
}

interface AnalyticsDataPoint {
  date: string;
  views: number;
  sales: number;
  revenue: number;
}

interface ListingStats {
  id: string;
  title: string;
  views: number;
  sales: number;
  avgRating: number;
  revenue: number;
}

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  periodStats: PeriodStats;
  dynamics: AnalyticsDataPoint[];
  listings: ListingStats[];
}

interface EarningsItem {
  id: string;
  listingTitle: string;
  buyerName: string;
  amount: number;
  createdAt: string;
  status: string;
}

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
};

const PERIODS: Period[] = ['day', 'week', 'month', 'quarter', 'year'];

// ==================== Helpers ====================

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
    month: 'short',
    year: 'numeric',
  });
}

// ==================== Stat Card ====================

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-surface-elevated rounded-xl p-5">
      <p className="text-sm text-text-secondary mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || 'text-text-primary'}`}>{value}</p>
    </div>
  );
}

// ==================== Main Page ====================

export default function SellerAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [recentSales, setRecentSales] = useState<EarningsItem[]>([]);
  const [unansweredCount, setUnansweredCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profileRes = await getProfile();
      setUser(profileRes.data);

      const role = profileRes.data.role;
      if (role !== 'ORGANIZER' && role !== 'ADMIN') {
        router.push('/organizer');
        return;
      }

      const [summaryRes, analyticsRes, earningsRes, unansweredRes] = await Promise.all([
        getMyAnalyticsSummary().catch(() => null),
        getMyAnalytics({ period, limit: 20 }).catch(() => null),
        getMyEarningsHistory({ limit: 10 }).catch(() => null),
        getUnansweredQuestionsCount().catch(() => null),
      ]);

      if (summaryRes?.data) setSummary(summaryRes.data);
      if (analyticsRes?.data) setAnalytics(analyticsRes.data);
      if (Array.isArray(earningsRes?.data)) setRecentSales(earningsRes.data.slice(0, 10));
      if (unansweredRes?.data) setUnansweredCount(unansweredRes.data.count);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить данные';
      setError(message);
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==================== Loading State ====================

  if (loading && !summary) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <LoadingSpinner size="lg" className="py-20" />
      </div>
    );
  }

  // ==================== Error State ====================

  if (error && !summary) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <button onClick={loadData} className="btn-primary">
              Повторить
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  // ==================== Render ====================

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 shrink-0">
            <div className="bg-surface-elevated rounded-xl p-4 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Кабинет продавца</h2>
              <nav className="space-y-1">
                <Link
                  href="/organizer/seller"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <span>📊</span>
                  <span>Обзор</span>
                </Link>
                <Link
                  href="/organizer/listings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <span>📦</span>
                  <span>Мои листинги</span>
                </Link>
                <Link
                  href="/organizer/seller/analytics"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium"
                >
                  <span>📊</span>
                  <span>Аналитика</span>
                </Link>
                <Link
                  href="/organizer/seller/questions"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <span>❓</span>
                  <span>
                    Вопросы
                    {unansweredCount > 0 && (
                      <span className="ml-auto bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unansweredCount}
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  href="/organizer/seller/payouts"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <span>💰</span>
                  <span>Выплаты</span>
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Аналитика</h1>
              <Link
                href="/marketplace/create"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
              >
                + Создать листинг
              </Link>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-text-secondary mr-2">Период:</span>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-primary text-white'
                      : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Summary Cards — 4 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Всего листингов"
                value={String(summary?.totalListings ?? analytics?.summary?.totalListings ?? 0)}
              />
              <StatCard
                label="Продаж"
                value={String(summary?.totalSales ?? analytics?.summary?.totalSales ?? 0)}
              />
              <StatCard
                label="Доход"
                value={formatPrice(summary?.totalRevenue ?? analytics?.summary?.totalRevenue ?? 0)}
                accent="text-green-500"
              />
              <StatCard
                label="Средний рейтинг"
                value={
                  (summary?.avgRating ?? analytics?.summary?.avgRating ?? 0) > 0
                    ? Number(summary?.avgRating ?? analytics?.summary?.avgRating ?? 0).toFixed(1)
                    : '—'
                }
              />
            </div>

            {/* Period Stats Cards — 3 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="Просмотры (за период)"
                value={String(analytics?.periodStats?.views ?? 0)}
              />
              <StatCard
                label="Продажи (за период)"
                value={String(analytics?.periodStats?.sales ?? 0)}
              />
              <StatCard
                label="Доход (за период)"
                value={formatPrice(analytics?.periodStats?.revenue ?? 0)}
                accent="text-green-500"
              />
            </div>

            {/* Dynamics Chart — Horizontal bars with dates */}
            {analytics?.dynamics && analytics.dynamics.length > 0 ? (
              <div className="bg-surface-elevated rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Динамика</h2>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs text-text-secondary font-medium pb-2 border-b border-border">
                    <div className="col-span-3">Дата</div>
                    <div className="col-span-3">Просмотры</div>
                    <div className="col-span-2 text-right">Продажи</div>
                    <div className="col-span-4 text-right">Доход</div>
                  </div>

                  {analytics.dynamics.map((point, idx) => {
                    const maxViews = Math.max(...analytics.dynamics.map((p) => p.views), 1);
                    const barWidth = (point.views / maxViews) * 100;

                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center text-sm">
                        <div className="col-span-3 text-text-secondary truncate">
                          {formatDate(point.date)}
                        </div>
                        <div className="col-span-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-4 bg-surface-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-secondary w-8 text-right shrink-0">
                              {point.views}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2 text-right text-text-primary font-medium">
                          {point.sales}
                        </div>
                        <div className="col-span-4 text-right text-green-500 font-medium">
                          {formatPrice(point.revenue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-surface-elevated rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Динамика</h2>
                <p className="text-text-secondary text-sm">Нет данных за выбранный период</p>
              </div>
            )}

            {/* Listings Table */}
            {analytics?.listings && analytics.listings.length > 0 ? (
              <div className="bg-surface-elevated rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Статистика по листингам</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-secondary">
                        <th className="text-left py-3 pr-4 font-medium">Название</th>
                        <th className="text-right py-3 px-4 font-medium">Просмотры</th>
                        <th className="text-right py-3 px-4 font-medium">Продажи</th>
                        <th className="text-right py-3 px-4 font-medium">Рейтинг</th>
                        <th className="text-right py-3 pl-4 font-medium">Доход</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.listings.map((listing) => (
                        <tr key={listing.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                          <td className="py-3 pr-4">
                            <Link
                              href={`/marketplace/${listing.id}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {listing.title}
                            </Link>
                          </td>
                          <td className="text-right py-3 px-4">{listing.views}</td>
                          <td className="text-right py-3 px-4">{listing.sales}</td>
                          <td className="text-right py-3 px-4">
                            {listing.avgRating > 0 ? listing.avgRating.toFixed(1) : '—'}
                          </td>
                          <td className="text-right py-3 pl-4 text-green-500 font-medium">
                            {formatPrice(listing.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-surface-elevated rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Статистика по листингам</h2>
                <p className="text-text-secondary text-sm">Нет данных</p>
              </div>
            )}

            {/* Recent Sales */}
            <div className="bg-surface-elevated rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Последние продажи</h2>
              {recentSales.length === 0 ? (
                <p className="text-text-secondary text-sm">Продаж пока нет</p>
              ) : (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{sale.listingTitle}</p>
                        <p className="text-xs text-text-secondary">
                          {sale.buyerName} · {formatDate(sale.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-green-500">
                          +{formatPrice(sale.amount)}
                        </span>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                          sale.status === 'completed'
                            ? 'bg-success/10 text-success'
                            : sale.status === 'pending'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-surface-elevated text-text-secondary'
                        }`}>
                          {sale.status === 'completed' ? 'Завершён' :
                           sale.status === 'pending' ? 'Ожидает' : sale.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}