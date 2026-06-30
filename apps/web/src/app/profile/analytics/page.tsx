'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  getMyAnalytics,
  getMyAnalyticsSummary,
  getMyEarningsHistory,
} from '@/lib/api/client';

interface AnalyticsSummary {
  totalListings: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalViews: number;
  totalFavorites: number;
}

interface AnalyticsDataPoint {
  date: string;
  views: number;
  sales: number;
  revenue: number;
}

interface EarningsEntry {
  id: string;
  amount: number;
  listingTitle: string;
  buyerName: string;
  createdAt: string;
  status: string;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsDataPoint[]>([]);
  const [earnings, setEarnings] = useState<EarningsEntry[]>([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [summaryRes, analyticsRes, earningsRes] = await Promise.all([
          getMyAnalyticsSummary(),
          getMyAnalytics({ period, limit: 30 }),
          getMyEarningsHistory({ limit: 20 }),
        ]);
        setSummary(summaryRes.data);
        setAnalytics(analyticsRes.data?.items || []);
        setEarnings(earningsRes.data?.items || []);
      } catch {
        setError('Ошибка загрузки аналитики');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  const totalViews = analytics.reduce((s, d) => s + d.views, 0);
  const totalSales = analytics.reduce((s, d) => s + d.sales, 0);
  const totalRevenue = analytics.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <button onClick={() => window.history.back()} className="text-primary hover:underline text-sm">
            ← Назад
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Аналитика</h1>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="year">Год</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">{summary?.totalListings || 0}</div>
                <div className="text-sm text-text-secondary">Листингов</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{summary?.totalSales || 0}</div>
                <div className="text-sm text-text-secondary">Продаж</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-1">{summary?.totalRevenue || 0} ₽</div>
                <div className="text-sm text-text-secondary">Доход</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">{summary?.averageRating?.toFixed(1) || '0.0'}</div>
                <div className="text-sm text-text-secondary">Рейтинг</div>
              </div>
            </div>

            {/* Period Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card p-4">
                <h3 className="text-sm text-text-secondary mb-1">Просмотры</h3>
                <p className="text-2xl font-bold">{totalViews}</p>
              </div>
              <div className="card p-4">
                <h3 className="text-sm text-text-secondary mb-1">Продажи</h3>
                <p className="text-2xl font-bold">{totalSales}</p>
              </div>
              <div className="card p-4">
                <h3 className="text-sm text-text-secondary mb-1">Доход</h3>
                <p className="text-2xl font-bold">{totalRevenue} ₽</p>
              </div>
            </div>

            {/* Analytics Chart (simplified) */}
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Динамика</h2>
              {analytics.length === 0 ? (
                <p className="text-text-secondary text-center py-8">Нет данных за выбранный период</p>
              ) : (
                <div className="space-y-2">
                  {analytics.slice().reverse().map((point, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm">
                      <span className="w-24 text-text-secondary flex-shrink-0">
                        {new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex-1 flex items-center gap-4">
                        <div className="flex-1 h-4 bg-card-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, (point.views / Math.max(...analytics.map(a => a.views), 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="w-16 text-right">{point.views}</span>
                        <span className="w-16 text-right text-green-500">{point.sales}</span>
                        <span className="w-20 text-right font-medium">{point.revenue} ₽</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Earnings */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Последние продажи</h2>
              {earnings.length === 0 ? (
                <EmptyState icon="📊" title="Нет продаж" description="Продажи появятся после покупки ваших сценариев" />
              ) : (
                <div className="space-y-3">
                  {earnings.map(e => (
                    <div key={e.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium">{e.listingTitle}</p>
                        <p className="text-sm text-text-secondary">{e.buyerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">+{e.amount} ₽</p>
                        <p className="text-xs text-text-secondary">
                          {new Date(e.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}